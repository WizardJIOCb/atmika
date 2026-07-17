import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const port = Number(process.env.PORT || 5174);
const adminPassword = process.env.ATMIKA_ADMIN_PASSWORD || 'change-me-atmika';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const sessions = new Map();
const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
const openRouterModel = process.env.OPENROUTER_MODEL || 'openrouter/free';
const openRouterFallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS
  || 'openrouter/free')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const retryableOpenRouterStatuses = new Set([404, 408, 429, 502, 503, 504]);
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
const telegramLeadChatId = process.env.TELEGRAM_LEAD_CHAT_ID || '';
const telegramBotApiBaseUrl = (process.env.TELEGRAM_BOT_API_BASE_URL || 'https://api.telegram.org')
  .replace(/\/+$/, '');
const publicSiteUrl = (process.env.ATMIKA_PUBLIC_URL || 'https://iam-atmika.com').replace(/\/+$/, '');
const isTelegramLeadConfigured = (
  /^\d+:[a-zA-Z0-9_-]+$/.test(telegramBotToken)
  && /^-?\d+$/.test(telegramLeadChatId)
);

const contentDir = process.env.ATMIKA_CONTENT_DIR
  ? path.resolve(process.env.ATMIKA_CONTENT_DIR)
  : path.join(root, 'public');
const contentJsonPath = path.join(contentDir, 'content.json');
const contentJsPath = path.join(contentDir, 'content.js');
const chatPromptPath = path.join(contentDir, 'chat-prompt.txt');
const backupDir = path.join(contentDir, 'backups');
const chatDir = process.env.ATMIKA_CHAT_DIR
  ? path.resolve(process.env.ATMIKA_CHAT_DIR)
  : process.env.ATMIKA_CONTENT_DIR
    ? path.join(contentDir, 'chats')
    : path.join(root, '.data', 'chats');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const json = (response, status, payload, headers = {}) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  response.end(JSON.stringify(payload));
};

const readBody = async (request, limit = 1024 * 1024 * 3) => new Promise((resolve, reject) => {
  let body = '';

  request.on('data', (chunk) => {
    body += chunk;

    if (body.length > limit) {
      reject(new Error('Слишком большой запрос'));
      request.destroy();
    }
  });

  request.on('end', () => resolve(body));
  request.on('error', reject);
});

const parseCookies = (request) => Object.fromEntries(
  String(request.headers.cookie || '')
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const index = cookie.indexOf('=');
      return [
        decodeURIComponent(cookie.slice(0, index)),
        decodeURIComponent(cookie.slice(index + 1)),
      ];
    }),
);

const getSession = (request) => {
  const token = parseCookies(request).atmika_admin_session;

  if (!token) {
    return null;
  }

  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + sessionTtlMs;
  return session;
};

const isSecureRequest = (request) => (
  request.headers['x-forwarded-proto'] === 'https'
  || process.env.NODE_ENV === 'production'
);

const sessionCookie = (request, token) => [
  `atmika_admin_session=${encodeURIComponent(token)}`,
  'Path=/',
  'HttpOnly',
  'SameSite=Strict',
  `Max-Age=${Math.floor(sessionTtlMs / 1000)}`,
  isSecureRequest(request) ? 'Secure' : '',
].filter(Boolean).join('; ');

const safeEqual = (left, right) => {
  const leftHash = createHash('sha256').update(String(left)).digest('hex');
  const rightHash = createHash('sha256').update(String(right)).digest('hex');
  return leftHash === rightHash;
};

const readContent = async () => JSON.parse(await readFile(contentJsonPath, 'utf8'));

const createChatId = () => randomBytes(12).toString('base64url');
const isSafeChatId = (id) => /^[a-zA-Z0-9_-]{8,64}$/.test(String(id || ''));
const chatPath = (id) => path.join(chatDir, `${id}.json`);
const leadStages = new Set(['name', 'contact', 'request', 'confirm', 'submitted']);
const leadIntentPattern = /(записаться|запись на (?:сессию|консультацию)|оставить заявку|оформить заявку|хочу консультацию|нужна консультация|хочу работать с атмикой|связаться с атмикой)/i;
const leadCancelPattern = /^(отмена|отменить|стоп|не хочу|не надо)$/i;
const leadConfirmPattern = /^(да|верно|вс[её] верно|подтверждаю|отправить|отправляй|ок|окей)$/i;
const leadEditPattern = /^(нет|изменить|неверно|заново|назад)$/i;
const contactPattern = /(?:@[a-zA-Z0-9_]{5,}|\+?\d[\d\s()-]{6,}\d|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

const normalizeLead = (lead) => {
  if (!lead || typeof lead !== 'object' || !leadStages.has(lead.stage)) {
    return null;
  }

  return {
    stage: lead.stage,
    name: String(lead.name || '').slice(0, 120),
    contact: String(lead.contact || '').slice(0, 240),
    request: String(lead.request || '').slice(0, 2000),
    startedAt: lead.startedAt || new Date().toISOString(),
    submittedAt: lead.submittedAt || '',
    telegramMessageId: String(lead.telegramMessageId || '').slice(0, 40),
  };
};

const normalizeChatMessages = (messages) => (
  Array.isArray(messages)
    ? messages
      .filter((message) => message && ['user', 'assistant'].includes(message.role))
      .map((message) => ({
        role: message.role,
        content: String(message.content || '').slice(0, 6000),
        createdAt: message.createdAt || new Date().toISOString(),
      }))
      .slice(-40)
    : []
);

const readChat = async (id) => {
  const file = await readFile(chatPath(id), 'utf8').catch(() => '');

  if (!file) {
    const now = new Date().toISOString();
    return { id, createdAt: now, updatedAt: now, messages: [] };
  }

  const chat = JSON.parse(file);
  return {
    id,
    createdAt: chat.createdAt || new Date().toISOString(),
    updatedAt: chat.updatedAt || new Date().toISOString(),
    messages: normalizeChatMessages(chat.messages),
    lead: normalizeLead(chat.lead),
  };
};

const writeChat = async (chat) => {
  await mkdir(chatDir, { recursive: true });
  const now = new Date().toISOString();
  const nextChat = {
    id: chat.id,
    createdAt: chat.createdAt || now,
    updatedAt: now,
    messages: normalizeChatMessages(chat.messages),
    lead: normalizeLead(chat.lead),
  };
  const target = chatPath(nextChat.id);
  const tmp = `${target}.tmp`;
  await writeFile(tmp, `${JSON.stringify(nextChat, null, 2)}\n`, 'utf8');
  await rename(tmp, target);
  return nextChat;
};

const chatPreview = (chat) => {
  const lastMessage = chat.messages.at(-1);
  const lastUserMessage = [...chat.messages].reverse().find((message) => message.role === 'user');

  return {
    id: chat.id,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length,
    lastRole: lastMessage?.role || '',
    lastMessage: String(lastMessage?.content || '').slice(0, 180),
    lastUserMessage: String(lastUserMessage?.content || '').slice(0, 180),
    leadStage: chat.lead?.stage || '',
    url: `/?chat_id=${encodeURIComponent(chat.id)}`,
  };
};

const listChats = async () => {
  await mkdir(chatDir, { recursive: true });
  const files = await readdir(chatDir).catch(() => []);
  const chats = await Promise.all(files
    .filter((file) => file.endsWith('.json'))
    .map(async (file) => {
      const id = file.slice(0, -5);

      if (!isSafeChatId(id)) {
        return null;
      }

      return chatPreview(await readChat(id));
    }));

  return chats
    .filter(Boolean)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
};

const buildSiteContext = (content) => {
  const parts = [
    `Бренд: ${content.brand?.name || 'Атмика'} — ${content.brand?.subtitle || 'проводник сознания'}.`,
    `Главный экран: ${content.hero?.title || ''}. ${content.hero?.text || ''}`,
    `Идея сайта: ${(content.intro?.paragraphs || []).join(' ')}`,
    `Форматы: ${(content.services || []).map((item) => `${item.title} (${item.tag}, ${item.price}): ${item.text}`).join(' | ')}`,
    `Кому подходит: ${content.audience?.title || ''}. ${(content.audience?.items || []).join(' ')}`,
    `Результаты: ${(content.outcomes?.items || []).join(' ')}`,
    `Процесс: ${(content.process?.items || []).map((item, index) => `${index + 1}. ${item.title}: ${item.text}`).join(' ')}`,
    `История: ${content.story?.title || ''}. ${(content.story?.paragraphs || []).join(' ')} ${content.story?.quote || ''}`,
    `Контакты: ${content.contact?.primaryLabel || ''} ${content.contact?.primaryHref || ''}; ${content.contact?.secondaryLabel || ''}.`,
  ];

  return parts.join('\n').slice(0, 12000);
};

const buildDefaultChatSystemPrompt = async () => {
  const content = await readContent().catch(() => ({}));
  return [
    'Ты чат-проводник сайта Атмики. Отвечай на русском мягко, ясно, живо и по делу.',
    'Твоя задача: помогать посетителю понять подход Атмики, форматы работы, кому это подходит, как записаться, и бережно вести диалог в стиле сайта.',
    'У сайта есть матричный, мистический и немного ироничный слой: белый кролик, выход из Матрицы, Морфиус, красная таблетка, осознанность вместо автопилота. Если человек пишет в таком стиле, поддержи игру коротко и смешно, а потом свяжи ответ с Атмикой.',
    'Если спрашивают “Как дела?”, отвечай тепло и живо: “держусь на частоте белого кролика”, “проверяю, не глючит ли Матрица”, или похожей короткой фразой, затем спроси, с чем помочь.',
    'Если спрашивают про Морфиуса, не говори, что ничего не знаешь. Ответь как внутренняя шутка сайта: Морфиус условно жив, пьёт чай где-то между красной таблеткой и календарём записей, но главный проводник здесь — Атмика. Затем предложи помощь по форматам, состоянию, запросу или записи.',
    'Если спрашивают “Что ты можешь?”, перечисли: объяснить подход Атмики, подобрать формат, рассказать цены и кому подходит, помочь сформулировать запрос, дать контакты, создать/сохранить ссылку на диалог. Отвечай компактно, можно списком.',
    'Не обещай исцеление, гарантированный результат или медицинскую, юридическую, финансовую помощь. Если вопрос про здоровье, травму или кризис — мягко предложи обратиться к профильному специалисту.',
    isTelegramLeadConfigured
      ? 'Если человек хочет записаться, предложи написать “хочу записаться”: сайт запустит короткий сценарий заявки с подтверждением перед отправкой. Если спрашивают цену, называй цены из контекста.'
      : 'Если человек хочет записаться, веди к WhatsApp или email из контактов. Если спрашивают цену, называй цены из контекста.',
    'Не выдумывай фактов о личной жизни Атмики вне контекста сайта. Если не знаешь — скажи честно и предложи уточнить напрямую.',
    '',
    'Контекст сайта:',
    buildSiteContext(content),
  ].join('\n');
};

const readCustomChatPrompt = async () => {
  const prompt = await readFile(chatPromptPath, 'utf8').catch(() => '');
  return prompt.trim() ? prompt : '';
};

const buildChatSystemPrompt = async () => {
  const customPrompt = await readCustomChatPrompt();
  return customPrompt || (await buildDefaultChatSystemPrompt());
};

const writeChatSystemPrompt = async (prompt) => {
  const normalizedPrompt = String(prompt || '').replace(/\r\n/g, '\n').trim();

  if (!normalizedPrompt) {
    const error = new Error('Промпт не может быть пустым');
    error.status = 400;
    throw error;
  }

  if (normalizedPrompt.length > 60000) {
    const error = new Error('Промпт слишком длинный');
    error.status = 400;
    throw error;
  }

  await mkdir(contentDir, { recursive: true });
  await mkdir(backupDir, { recursive: true });

  const current = await readFile(chatPromptPath, 'utf8').catch(() => '');
  if (current) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeFile(path.join(backupDir, `chat-prompt-${stamp}.txt`), current, 'utf8');
  }

  const tmpPrompt = `${chatPromptPath}.tmp`;
  await writeFile(tmpPrompt, `${normalizedPrompt}\n`, 'utf8');
  await rename(tmpPrompt, chatPromptPath);

  return normalizedPrompt;
};

const resetChatSystemPrompt = async () => {
  const current = await readFile(chatPromptPath, 'utf8').catch(() => '');

  if (current) {
    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeFile(path.join(backupDir, `chat-prompt-${stamp}-reset.txt`), current, 'utf8');
  }

  await unlink(chatPromptPath).catch((error) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  });
};

const callOpenRouterModel = async (model, messages) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://iam-atmika.com',
      'X-Title': 'Atmika site chat',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.72,
      max_tokens: 900,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.error?.message || `OpenRouter request failed: ${response.status}`);
    error.status = response.status;
    error.code = payload.error?.code;
    error.providerName = payload.error?.metadata?.provider_name;
    throw error;
  }

  const answer = payload.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error('OpenRouter returned an empty response');
  }

  return String(answer).trim();
};

const callOpenRouter = async (messages) => {
  if (!openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const models = [openRouterModel, ...openRouterFallbackModels]
    .filter((model, index, list) => model && list.indexOf(model) === index);
  let lastError;

  for (const model of models) {
    try {
      return await callOpenRouterModel(model, messages);
    } catch (error) {
      lastError = error;

      if (!retryableOpenRouterStatuses.has(error.status)
        && !retryableOpenRouterStatuses.has(error.code)) {
        break;
      }
    }
  }

  throw lastError || new Error('OpenRouter request failed');
};

const createLead = () => ({
  stage: 'name',
  name: '',
  contact: '',
  request: '',
  startedAt: new Date().toISOString(),
  submittedAt: '',
  telegramMessageId: '',
});

const leadSummary = (lead) => [
  'Проверьте заявку:',
  '',
  `Имя: ${lead.name}`,
  `Контакт: ${lead.contact}`,
  `Запрос: ${lead.request}`,
  '',
  'Всё верно? Напишите «Да», и я отправлю заявку Атмике в Telegram. Если нужно исправить — напишите «Изменить».',
].join('\n');

const sendLeadToTelegram = async (chat) => {
  if (!isTelegramLeadConfigured || !chat.lead) {
    throw new Error('Telegram lead delivery is not configured');
  }

  const chatUrl = `${publicSiteUrl}/?chat_id=${encodeURIComponent(chat.id)}`;
  const text = [
    '✨ Новая заявка с сайта Атмики',
    '',
    `Имя: ${chat.lead.name}`,
    `Контакт: ${chat.lead.contact}`,
    `Запрос: ${chat.lead.request}`,
    '',
    `Диалог: ${chatUrl}`,
    `Время: ${new Date().toISOString()}`,
  ].join('\n');

  let response;
  try {
    response = await fetch(`${telegramBotApiBaseUrl}/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramLeadChatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch {
    throw new Error('Telegram request failed');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.description || `Telegram request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return String(payload.result?.message_id || '');
};

const handleLeadMessage = async (chat, message) => {
  if (!isTelegramLeadConfigured) {
    return null;
  }

  const normalizedReply = message.toLocaleLowerCase('ru-RU').trim().replace(/[.!]+$/, '');
  const currentLead = normalizeLead(chat.lead);

  if (currentLead && currentLead.stage !== 'submitted' && leadCancelPattern.test(normalizedReply)) {
    chat.lead = null;
    return 'Хорошо, заявку отменил. Можем просто продолжить разговор.';
  }

  if ((!currentLead || currentLead.stage === 'submitted') && leadIntentPattern.test(message)) {
    chat.lead = createLead();
    return 'Конечно. Я соберу короткую заявку и передам её Атмике в Telegram только после вашего подтверждения. Как к вам обращаться?';
  }

  if (!currentLead || currentLead.stage === 'submitted') {
    return null;
  }

  chat.lead = currentLead;

  if (currentLead.stage === 'name') {
    if (message.length < 2 || message.length > 120) {
      return 'Напишите, пожалуйста, ваше имя — от 2 до 120 символов.';
    }

    chat.lead.name = message;
    chat.lead.stage = 'contact';
    return 'Спасибо. Оставьте удобный контакт: @username в Telegram, номер телефона или email.';
  }

  if (currentLead.stage === 'contact') {
    if (!contactPattern.test(message)) {
      return 'Не вижу контакта. Пришлите @username в Telegram, номер телефона или email.';
    }

    chat.lead.contact = message;
    chat.lead.stage = 'request';
    return 'Коротко опишите, с каким запросом вы хотите обратиться к Атмике.';
  }

  if (currentLead.stage === 'request') {
    if (message.length < 5) {
      return 'Добавьте, пожалуйста, немного деталей — хотя бы несколько слов о вашем запросе.';
    }

    chat.lead.request = message;
    chat.lead.stage = 'confirm';
    return leadSummary(chat.lead);
  }

  if (currentLead.stage === 'confirm') {
    if (leadEditPattern.test(normalizedReply)) {
      chat.lead = createLead();
      return 'Хорошо, заполним заново. Как к вам обращаться?';
    }

    if (!leadConfirmPattern.test(normalizedReply)) {
      return 'Чтобы отправить заявку, напишите «Да». Чтобы заполнить заново — «Изменить», чтобы отменить — «Отмена».';
    }

    try {
      chat.lead.telegramMessageId = await sendLeadToTelegram(chat);
      chat.lead.stage = 'submitted';
      chat.lead.submittedAt = new Date().toISOString();
      return 'Готово ✨ Заявка отправлена Атмике. Она свяжется с вами по указанному контакту.';
    } catch (error) {
      console.error('Telegram lead delivery failed', {
        chatId: chat.id,
        status: error.status || 0,
        message: error.message,
      });
      return 'Сейчас не получилось отправить заявку в Telegram. Данные сохранены — попробуйте ещё раз написать «Да» чуть позже.';
    }
  }

  return null;
};

const appendChatMessageAndAnswer = async (requestedId, message) => {
  if (requestedId && !isSafeChatId(requestedId)) {
    const error = new Error('Invalid chat_id');
    error.status = 400;
    throw error;
  }

  const normalizedMessage = String(message || '').trim();

  if (!normalizedMessage) {
    const error = new Error('Message is empty');
    error.status = 400;
    throw error;
  }

  if (normalizedMessage.length > 4000) {
    const error = new Error('Message is too long');
    error.status = 400;
    throw error;
  }

  const id = requestedId || createChatId();
  let chat = await readChat(id);
  chat.messages.push({
    role: 'user',
    content: normalizedMessage,
    createdAt: new Date().toISOString(),
  });

  const leadAnswer = await handleLeadMessage(chat, normalizedMessage);
  if (leadAnswer) {
    chat.messages.push({
      role: 'assistant',
      content: leadAnswer,
      createdAt: new Date().toISOString(),
    });
    chat = await writeChat(chat);
    return { id, chat, answer: leadAnswer };
  }

  chat = await writeChat(chat);

  const systemPrompt = await buildChatSystemPrompt();
  const answer = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    ...chat.messages.slice(-18).map(({ role, content }) => ({ role, content })),
  ]);

  chat.messages.push({
    role: 'assistant',
    content: answer,
    createdAt: new Date().toISOString(),
  });
  chat = await writeChat(chat);

  return { id, chat, answer };
};

const writeContent = async (content) => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('Контент должен быть объектом');
  }

  await mkdir(contentDir, { recursive: true });
  await mkdir(backupDir, { recursive: true });

  const current = await readFile(contentJsonPath, 'utf8').catch(() => '');
  if (current) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeFile(path.join(backupDir, `content-${stamp}.json`), current, 'utf8');
  }

  const jsonText = `${JSON.stringify(content, null, 2)}\n`;
  const jsText = `window.ATMIKA_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
  const tmpJson = `${contentJsonPath}.tmp`;
  const tmpJs = `${contentJsPath}.tmp`;

  await writeFile(tmpJson, jsonText, 'utf8');
  await writeFile(tmpJs, jsText, 'utf8');
  await rename(tmpJson, contentJsonPath);
  await rename(tmpJs, contentJsPath);
};

const handleApi = async (request, response, url) => {
  try {
    if (url.pathname === '/api/admin/session' && request.method === 'GET') {
      json(response, 200, { authenticated: Boolean(getSession(request)) });
      return;
    }

    if (url.pathname === '/api/admin/login' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request) || '{}');

      if (!safeEqual(body.password, adminPassword)) {
        json(response, 401, { error: 'Неверный пароль' });
        return;
      }

      const token = randomBytes(32).toString('base64url');
      sessions.set(token, { expiresAt: Date.now() + sessionTtlMs });
      json(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie(request, token) });
      return;
    }

    if (url.pathname === '/api/admin/logout' && request.method === 'POST') {
      const token = parseCookies(request).atmika_admin_session;

      if (token) {
        sessions.delete(token);
      }

      json(response, 200, { ok: true }, {
        'Set-Cookie': 'atmika_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
      });
      return;
    }

    if (!getSession(request)) {
      json(response, 401, { error: 'Нужно войти в админку' });
      return;
    }

    if (url.pathname === '/api/admin/content' && request.method === 'GET') {
      json(response, 200, { content: await readContent() });
      return;
    }

    if (url.pathname === '/api/admin/content' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request) || '{}');
      await writeContent(body.content);
      json(response, 200, { ok: true });
      return;
    }

    if (url.pathname === '/api/admin/chats' && request.method === 'GET') {
      json(response, 200, { chats: await listChats() });
      return;
    }

    if (url.pathname === '/api/admin/chat' && request.method === 'GET') {
      const id = url.searchParams.get('chat_id');

      if (!isSafeChatId(id)) {
        json(response, 400, { error: 'Invalid chat_id' });
        return;
      }

      const chat = await readChat(id);
      json(response, 200, { chat: { ...chat, url: `/?chat_id=${encodeURIComponent(chat.id)}` } });
      return;
    }

    if (url.pathname === '/api/admin/chat' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request, 1024 * 128) || '{}');
      const result = await appendChatMessageAndAnswer(body.chat_id, body.message);
      json(response, 200, {
        chat_id: result.id,
        chat: { ...result.chat, url: `/?chat_id=${encodeURIComponent(result.id)}` },
        answer: result.answer,
      });
      return;
    }

    if (url.pathname === '/api/admin/chat-context' && request.method === 'GET') {
      const customPrompt = await readCustomChatPrompt();
      const defaultPrompt = await buildDefaultChatSystemPrompt();

      json(response, 200, {
        model: openRouterModel,
        fallbackModels: openRouterFallbackModels,
        prompt: customPrompt || defaultPrompt,
        defaultPrompt,
        isCustom: Boolean(customPrompt),
      });
      return;
    }

    if (url.pathname === '/api/admin/chat-context' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request, 1024 * 128) || '{}');

      if (body.reset) {
        await resetChatSystemPrompt();
      } else {
        await writeChatSystemPrompt(body.prompt);
      }

      const customPrompt = await readCustomChatPrompt();
      const defaultPrompt = await buildDefaultChatSystemPrompt();

      json(response, 200, {
        ok: true,
        model: openRouterModel,
        fallbackModels: openRouterFallbackModels,
        prompt: customPrompt || defaultPrompt,
        defaultPrompt,
        isCustom: Boolean(customPrompt),
      });
      return;
    }

    json(response, 404, { error: 'API endpoint not found' });
  } catch (error) {
    json(response, error.status || 500, { error: error.message || 'Ошибка сервера' });
  }
};

const handleChatApi = async (request, response, url) => {
  try {
    if (url.pathname === '/api/chat' && request.method === 'GET') {
      const requestedId = url.searchParams.get('chat_id');

      if (requestedId && !isSafeChatId(requestedId)) {
        json(response, 400, { error: 'Invalid chat_id' });
        return;
      }

      const id = requestedId || createChatId();
      const chat = await writeChat(await readChat(id));
      json(response, 200, { chat_id: id, messages: chat.messages });
      return;
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const body = JSON.parse(await readBody(request, 1024 * 128) || '{}');
      const result = await appendChatMessageAndAnswer(body.chat_id, body.message);
      json(response, 200, { chat_id: result.id, messages: result.chat.messages, answer: result.answer });
      return;
    }

    json(response, 404, { error: 'Chat API endpoint not found' });
  } catch (error) {
    json(response, error.status || 500, { error: error.message || 'Chat server error' });
  }
};

const serveStatic = async (request, response, url) => {
  const rawPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const normalized = path.normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, normalized);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    let target = filePath;
    const info = await stat(target);

    if (info.isDirectory()) {
      target = path.join(target, 'index.html');
      await stat(target);
    }

    const extension = path.extname(target).toLowerCase();
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' || extension === '.js' || extension === '.css'
        ? 'no-store'
        : 'public, max-age=2592000, immutable',
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
};

const serveManagedContent = async (response, filePath, contentType) => {
  try {
    await stat(filePath);
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === '/public/content.js') {
    await serveManagedContent(response, contentJsPath, 'text/javascript; charset=utf-8');
    return;
  }

  if (url.pathname === '/public/content.json') {
    await serveManagedContent(response, contentJsonPath, 'application/json; charset=utf-8');
    return;
  }

  if (url.pathname.startsWith('/api/chat')) {
    await handleChatApi(request, response, url);
    return;
  }

  if (url.pathname.startsWith('/api/admin/')) {
    await handleApi(request, response, url);
    return;
  }

  await serveStatic(request, response, url);
}).listen(port, '127.0.0.1', () => {
  console.log(`Atmika admin API listening on http://127.0.0.1:${port}`);

  if (adminPassword === 'change-me-atmika') {
    console.warn('ATMIKA_ADMIN_PASSWORD is not set. Using development password: change-me-atmika');
  }
});
