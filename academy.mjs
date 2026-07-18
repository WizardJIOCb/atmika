import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdir, open, readFile, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const now = () => new Date().toISOString();
const bool = (value) => (value ? 1 : 0);
const trim = (value, max = 5000) => String(value ?? '').trim().slice(0, max);
const legalDocumentVersion = '18.07.2026-r2';
const operatorIdentityVersion = 'pankratova-2026-07-18';
const operatorIdentitySettings = {
  sellerName: 'Атмика',
  sellerLegalName: 'ИП Панкратова Оксана Сергеевна',
  sellerStatus: 'Индивидуальный предприниматель',
  inn: '236504298920',
  ogrn: '326237500235369',
  legalAddress: '',
  postalAddress: '',
  phone: '',
  email: 'magicscar8@gmail.com',
  supportEmail: 'magicscar8@gmail.com',
};
const safeJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseCookies = (request) => Object.fromEntries(
  String(request.headers.cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separator = item.indexOf('=');
      return separator < 0
        ? [decodeURIComponent(item), '']
        : [decodeURIComponent(item.slice(0, separator)), decodeURIComponent(item.slice(separator + 1))];
    }),
);

const slugify = (value, fallback = 'item') => {
  const translit = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const normalized = String(value || '').toLocaleLowerCase('ru-RU')
    .split('')
    .map((character) => translit[character] ?? character)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
  return normalized || fallback;
};

const defaultSettings = {
  title: 'Курсы Атмики',
  eyebrow: 'Пространство обучения',
  description: 'Практики, программы и материалы для самостоятельного прохождения.',
  ...operatorIdentitySettings,
  operatorIdentityVersion,
  accessInstructions: 'После успешной оплаты доступ откроется в личном кабинете на iam-atmika.com.',
  refundSummary: 'Для возврата напишите на электронную почту поддержки. Условия и срок возврата определяются офертой и применимым законодательством.',
  offerHtml: '',
  privacyHtml: '',
  consentHtml: '',
  paymentHtml: '',
  vatCode: '1',
};

const blockTypes = new Set(['text', 'image', 'video', 'carousel', 'quote', 'audio', 'file', 'button', 'divider']);
const normalizeBlocks = (value) => (Array.isArray(value) ? value : [])
  .slice(0, 300)
  .map((block) => ({
    id: /^[a-zA-Z0-9_-]{6,80}$/.test(String(block?.id || '')) ? String(block.id) : randomUUID(),
    type: blockTypes.has(block?.type) ? block.type : 'text',
    data: block?.data && typeof block.data === 'object' && !Array.isArray(block.data) ? block.data : {},
  }));

const normalizeMediaType = (value) => (value === 'video' ? 'video' : 'image');
const normalizeAccess = (value) => (value === 'paid' ? 'paid' : 'free');
const normalizePrice = (value) => Math.max(0, Math.min(100_000_000_00, Math.round(Number(value) || 0)));

const normalizeCategory = (category, index) => ({
  id: /^[a-zA-Z0-9_-]{8,80}$/.test(String(category?.id || '')) ? String(category.id) : randomUUID(),
  slug: slugify(category?.slug || category?.title, `category-${index + 1}`),
  title: trim(category?.title, 180) || `Категория ${index + 1}`,
  description: trim(category?.description, 2000),
  coverType: normalizeMediaType(category?.coverType),
  coverUrl: trim(category?.coverUrl, 2000),
  coverPoster: trim(category?.coverPoster, 2000),
  published: Boolean(category?.published),
  position: Number.isFinite(Number(category?.position)) ? Number(category.position) : index,
});

const normalizeCourse = (course, index, categoryIds) => ({
  id: /^[a-zA-Z0-9_-]{8,80}$/.test(String(course?.id || '')) ? String(course.id) : randomUUID(),
  categoryId: categoryIds.has(String(course?.categoryId || '')) ? String(course.categoryId) : '',
  slug: slugify(course?.slug || course?.title, `course-${index + 1}`),
  title: trim(course?.title, 180) || `Курс ${index + 1}`,
  summary: trim(course?.summary, 1200),
  coverType: normalizeMediaType(course?.coverType),
  coverUrl: trim(course?.coverUrl, 2000),
  coverPoster: trim(course?.coverPoster, 2000),
  accessType: normalizeAccess(course?.accessType),
  priceKopecks: normalizePrice(course?.priceKopecks),
  published: Boolean(course?.published),
  featured: Boolean(course?.featured),
  position: Number.isFinite(Number(course?.position)) ? Number(course.position) : index,
  content: normalizeBlocks(course?.content),
});

const normalizeMaterial = (material, index, courseIds) => ({
  id: /^[a-zA-Z0-9_-]{8,80}$/.test(String(material?.id || '')) ? String(material.id) : randomUUID(),
  courseId: courseIds.has(String(material?.courseId || '')) ? String(material.courseId) : '',
  slug: slugify(material?.slug || material?.title, `material-${index + 1}`),
  title: trim(material?.title, 180) || `Материал ${index + 1}`,
  excerpt: trim(material?.excerpt, 1600),
  coverType: normalizeMediaType(material?.coverType),
  coverUrl: trim(material?.coverUrl, 2000),
  coverPoster: trim(material?.coverPoster, 2000),
  accessType: normalizeAccess(material?.accessType),
  priceKopecks: normalizePrice(material?.priceKopecks),
  published: Boolean(material?.published),
  position: Number.isFinite(Number(material?.position)) ? Number(material.position) : index,
  content: normalizeBlocks(material?.content),
});

const publicCategory = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description,
  coverType: row.cover_type,
  coverUrl: row.cover_url,
  coverPoster: row.cover_poster,
  position: row.position,
});

const publicCourse = (row) => ({
  id: row.id,
  categoryId: row.category_id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  coverType: row.cover_type,
  coverUrl: row.cover_url,
  coverPoster: row.cover_poster,
  accessType: row.access_type,
  priceKopecks: row.price_kopecks,
  featured: Boolean(row.featured),
  position: row.position,
});

const publicMaterial = (row) => ({
  id: row.id,
  courseId: row.course_id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  coverType: row.cover_type,
  coverUrl: row.cover_url,
  coverPoster: row.cover_poster,
  accessType: row.access_type,
  priceKopecks: row.price_kopecks,
  position: row.position,
});

const adminCategory = (row) => ({ ...publicCategory(row), published: Boolean(row.published) });
const adminCourse = (row) => ({
  ...publicCourse(row),
  published: Boolean(row.published),
  content: safeJson(row.content_json, []),
});
const adminMaterial = (row) => ({
  ...publicMaterial(row),
  published: Boolean(row.published),
  content: safeJson(row.content_json, []),
});

const passwordDigest = (password, salt) => scryptSync(String(password), salt, 64);
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').toLowerCase());
const sessionHash = (token) => createHash('sha256').update(token).digest('hex');

export const createAcademy = ({ root, publicSiteUrl, isSecureRequest }) => {
  const dataDir = process.env.ATMIKA_ACADEMY_DATA_DIR
    ? path.resolve(process.env.ATMIKA_ACADEMY_DATA_DIR)
    : path.join(root, '.data');
  const databasePath = path.join(dataDir, 'academy.sqlite');
  const uploadDir = process.env.ATMIKA_UPLOAD_DIR
    ? path.resolve(process.env.ATMIKA_UPLOAD_DIR)
    : path.join(root, 'public', 'uploads', 'academy');
  const uploadPublicPath = '/public/uploads/academy';
  const sessionTtlMs = 1000 * 60 * 60 * 24 * 30;
  const shopId = trim(process.env.YOOKASSA_SHOP_ID || '1412445', 120);
  const secretKey = trim(process.env.YOOKASSA_SECRET_KEY, 300);
  const yookassaApiUrl = (process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru/v3').replace(/\/+$/, '');
  const receiptsEnabled = String(process.env.YOOKASSA_RECEIPTS_ENABLED || 'true').toLowerCase() !== 'false';
  const publicBaseUrl = (publicSiteUrl || 'https://iam-atmika.com').replace(/\/+$/, '');

  let db;

  const initialize = async () => {
    await mkdir(dataDir, { recursive: true });
    await mkdir(uploadDir, { recursive: true });
    db = new DatabaseSync(databasePath);
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS academy_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS academy_categories (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        cover_type TEXT NOT NULL DEFAULT 'image',
        cover_url TEXT NOT NULL DEFAULT '',
        cover_poster TEXT NOT NULL DEFAULT '',
        published INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS academy_courses (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        cover_type TEXT NOT NULL DEFAULT 'image',
        cover_url TEXT NOT NULL DEFAULT '',
        cover_poster TEXT NOT NULL DEFAULT '',
        access_type TEXT NOT NULL DEFAULT 'free',
        price_kopecks INTEGER NOT NULL DEFAULT 0,
        content_json TEXT NOT NULL DEFAULT '[]',
        published INTEGER NOT NULL DEFAULT 0,
        featured INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES academy_categories(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS academy_materials (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        cover_type TEXT NOT NULL DEFAULT 'image',
        cover_url TEXT NOT NULL DEFAULT '',
        cover_poster TEXT NOT NULL DEFAULT '',
        access_type TEXT NOT NULL DEFAULT 'free',
        price_kopecks INTEGER NOT NULL DEFAULT 0,
        content_json TEXT NOT NULL DEFAULT '[]',
        published INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (course_id, slug),
        FOREIGN KEY (course_id) REFERENCES academy_courses(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS academy_users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT '',
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS academy_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS academy_legal_acceptances (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        document_version TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS academy_payments (
        id TEXT PRIMARY KEY,
        yookassa_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_name TEXT NOT NULL DEFAULT '',
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_title TEXT NOT NULL,
        amount_kopecks INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'RUB',
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT NOT NULL DEFAULT '',
        confirmation_url TEXT NOT NULL DEFAULT '',
        test INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        paid_at TEXT NOT NULL DEFAULT '',
        FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE RESTRICT
      );
      CREATE TABLE IF NOT EXISTS academy_entitlements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        payment_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (user_id, target_type, target_id),
        FOREIGN KEY (user_id) REFERENCES academy_users(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_id) REFERENCES academy_payments(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS academy_courses_category_idx ON academy_courses(category_id, position);
      CREATE INDEX IF NOT EXISTS academy_materials_course_idx ON academy_materials(course_id, position);
      CREATE INDEX IF NOT EXISTS academy_payments_created_idx ON academy_payments(created_at DESC);
      CREATE INDEX IF NOT EXISTS academy_entitlements_user_idx ON academy_entitlements(user_id);
      CREATE INDEX IF NOT EXISTS academy_legal_acceptances_user_idx ON academy_legal_acceptances(user_id, created_at DESC);
    `);
    const settings = db.prepare('SELECT value_json FROM academy_settings WHERE id = 1').get();
    if (!settings) {
      db.prepare('INSERT INTO academy_settings (id, value_json, updated_at) VALUES (1, ?, ?)')
        .run(JSON.stringify(defaultSettings), now());
    } else {
      const storedSettings = safeJson(settings.value_json, {});
      if (storedSettings.operatorIdentityVersion !== operatorIdentityVersion) {
        db.prepare('UPDATE academy_settings SET value_json = ?, updated_at = ? WHERE id = 1')
          .run(JSON.stringify({
            ...storedSettings,
            ...operatorIdentitySettings,
            operatorIdentityVersion,
          }), now());
      }
    }
  };

  const ready = initialize();
  const ensureReady = async () => ready;

  const getSettings = () => {
    const settings = {
      ...defaultSettings,
      ...safeJson(db.prepare('SELECT value_json FROM academy_settings WHERE id = 1').get()?.value_json, {}),
    };
    ['sellerName', 'sellerLegalName', 'sellerStatus', 'inn', 'ogrn', 'email', 'supportEmail'].forEach((key) => {
      if (!trim(settings[key])) settings[key] = defaultSettings[key];
    });
    return settings;
  };

  const publicSettings = () => {
    const settings = getSettings();
    return {
      title: settings.title,
      eyebrow: settings.eyebrow,
      description: settings.description,
      sellerName: settings.sellerName,
      sellerLegalName: settings.sellerLegalName,
      sellerStatus: settings.sellerStatus,
      inn: settings.inn,
      ogrn: settings.ogrn,
      legalAddress: settings.legalAddress,
      postalAddress: settings.postalAddress,
      phone: settings.phone,
      email: settings.email,
      supportEmail: settings.supportEmail,
      legalDocumentVersion,
      accessInstructions: settings.accessInstructions,
      refundSummary: settings.refundSummary,
    };
  };

  const setSessionCookie = (request, token) => [
    `atmika_academy_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(sessionTtlMs / 1000)}`,
    isSecureRequest(request) ? 'Secure' : '',
  ].filter(Boolean).join('; ');

  const clearSessionCookie = () => 'atmika_academy_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

  const currentUser = (request) => {
    const token = parseCookies(request).atmika_academy_session;
    if (!token) return null;
    const row = db.prepare(`
      SELECT users.id, users.email, users.name, sessions.expires_at
      FROM academy_sessions sessions
      JOIN academy_users users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `).get(sessionHash(token));
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
      db.prepare('DELETE FROM academy_sessions WHERE token_hash = ?').run(sessionHash(token));
      return null;
    }
    return { id: row.id, email: row.email, name: row.name };
  };

  const createSession = (request, responseHeaders, userId) => {
    const token = randomBytes(32).toString('base64url');
    const stamp = now();
    const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();
    db.prepare('INSERT INTO academy_sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .run(sessionHash(token), userId, expiresAt, stamp);
    responseHeaders['Set-Cookie'] = setSessionCookie(request, token);
  };

  const verifyPassword = (row, password) => {
    if (!row || !password) return false;
    const actual = passwordDigest(password, row.password_salt);
    const expected = Buffer.from(row.password_hash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  };

  const createUser = (name, email, password) => {
    const normalizedEmail = trim(email, 240).toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      const error = new Error('Укажите корректный email');
      error.status = 400;
      throw error;
    }
    if (String(password || '').length < 8) {
      const error = new Error('Пароль должен содержать не менее 8 символов');
      error.status = 400;
      throw error;
    }
    if (db.prepare('SELECT id FROM academy_users WHERE email = ?').get(normalizedEmail)) {
      const error = new Error('Аккаунт с таким email уже существует');
      error.status = 409;
      throw error;
    }
    const id = randomUUID();
    const salt = randomBytes(16).toString('hex');
    const stamp = now();
    db.prepare(`
      INSERT INTO academy_users (id, email, name, password_hash, password_salt, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, normalizedEmail, trim(name, 180), passwordDigest(password, salt).toString('hex'), salt, stamp, stamp);
    return { id, email: normalizedEmail, name: trim(name, 180) };
  };

  const recordLegalAcceptance = (userId, kind) => {
    db.prepare(`
      INSERT INTO academy_legal_acceptances (id, user_id, kind, document_version, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, trim(kind, 80), legalDocumentVersion, now());
  };

  const userEntitlements = (userId) => new Set(
    userId
      ? db.prepare('SELECT target_type, target_id FROM academy_entitlements WHERE user_id = ?').all(userId)
        .map((row) => `${row.target_type}:${row.target_id}`)
      : [],
  );

  const canAccessMaterial = (material, course, entitlements) => (
    material.access_type === 'free'
    || entitlements.has(`material:${material.id}`)
    || (course.access_type === 'paid' && entitlements.has(`course:${course.id}`))
  );

  const listCatalog = (user) => {
    const entitlements = userEntitlements(user?.id);
    const categories = db.prepare('SELECT * FROM academy_categories WHERE published = 1 ORDER BY position, created_at').all()
      .map(publicCategory);
    const courses = db.prepare('SELECT * FROM academy_courses WHERE published = 1 ORDER BY position, created_at').all()
      .map((row) => ({
        ...publicCourse(row),
        owned: entitlements.has(`course:${row.id}`),
      }));
    const courseById = new Map(courses.map((course) => [course.id, course]));
    const materials = db.prepare('SELECT * FROM academy_materials WHERE published = 1 ORDER BY position, created_at').all()
      .map((row) => {
        const course = courseById.get(row.course_id);
        const access = course ? canAccessMaterial(row, {
          id: course.id,
          access_type: course.accessType,
        }, entitlements) : row.access_type === 'free';
        return { ...publicMaterial(row), canAccess: access };
      });
    return { settings: publicSettings(), categories, courses, materials, user: user || null };
  };

  const legalDocument = (type) => {
    const settings = getSettings();
    const custom = type === 'offer'
      ? settings.offerHtml
      : type === 'privacy'
        ? settings.privacyHtml
        : type === 'consent'
          ? settings.consentHtml
          : settings.paymentHtml;
    return {
      type,
      html: trim(custom, 200_000),
      documentVersion: legalDocumentVersion,
      settings: publicSettings(),
    };
  };

  const saveCatalog = (payload) => {
    const inputCategories = Array.isArray(payload?.categories) ? payload.categories : [];
    const categories = inputCategories.map(normalizeCategory);
    const categoryIds = new Set(categories.map((item) => item.id));
    const inputCourses = Array.isArray(payload?.courses) ? payload.courses : [];
    const courses = inputCourses.map((item, index) => normalizeCourse(item, index, categoryIds))
      .filter((item) => item.categoryId);
    const courseIds = new Set(courses.map((item) => item.id));
    const inputMaterials = Array.isArray(payload?.materials) ? payload.materials : [];
    const materials = inputMaterials.map((item, index) => normalizeMaterial(item, index, courseIds))
      .filter((item) => item.courseId);
    const settings = {
      ...defaultSettings,
      ...(payload?.settings && typeof payload.settings === 'object' ? payload.settings : {}),
    };
    Object.keys(defaultSettings).forEach((key) => {
      settings[key] = trim(settings[key], ['offerHtml', 'privacyHtml', 'consentHtml', 'paymentHtml'].includes(key) ? 200_000 : 5000);
    });

    const stamp = now();
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('UPDATE academy_settings SET value_json = ?, updated_at = ? WHERE id = 1')
        .run(JSON.stringify(settings), stamp);

      const upsertCategory = db.prepare(`
        INSERT INTO academy_categories
          (id, slug, title, description, cover_type, cover_url, cover_poster, published, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          slug=excluded.slug, title=excluded.title, description=excluded.description,
          cover_type=excluded.cover_type, cover_url=excluded.cover_url, cover_poster=excluded.cover_poster,
          published=excluded.published, position=excluded.position, updated_at=excluded.updated_at
      `);
      categories.forEach((item) => upsertCategory.run(
        item.id, item.slug, item.title, item.description, item.coverType, item.coverUrl,
        item.coverPoster, bool(item.published), item.position, stamp, stamp,
      ));

      const upsertCourse = db.prepare(`
        INSERT INTO academy_courses
          (id, category_id, slug, title, summary, cover_type, cover_url, cover_poster, access_type,
           price_kopecks, content_json, published, featured, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          category_id=excluded.category_id, slug=excluded.slug, title=excluded.title, summary=excluded.summary,
          cover_type=excluded.cover_type, cover_url=excluded.cover_url, cover_poster=excluded.cover_poster,
          access_type=excluded.access_type, price_kopecks=excluded.price_kopecks, content_json=excluded.content_json,
          published=excluded.published, featured=excluded.featured, position=excluded.position, updated_at=excluded.updated_at
      `);
      courses.forEach((item) => upsertCourse.run(
        item.id, item.categoryId, item.slug, item.title, item.summary, item.coverType, item.coverUrl,
        item.coverPoster, item.accessType, item.priceKopecks, JSON.stringify(item.content), bool(item.published),
        bool(item.featured), item.position, stamp, stamp,
      ));

      const upsertMaterial = db.prepare(`
        INSERT INTO academy_materials
          (id, course_id, slug, title, excerpt, cover_type, cover_url, cover_poster, access_type,
           price_kopecks, content_json, published, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          course_id=excluded.course_id, slug=excluded.slug, title=excluded.title, excerpt=excluded.excerpt,
          cover_type=excluded.cover_type, cover_url=excluded.cover_url, cover_poster=excluded.cover_poster,
          access_type=excluded.access_type, price_kopecks=excluded.price_kopecks, content_json=excluded.content_json,
          published=excluded.published, position=excluded.position, updated_at=excluded.updated_at
      `);
      materials.forEach((item) => upsertMaterial.run(
        item.id, item.courseId, item.slug, item.title, item.excerpt, item.coverType, item.coverUrl,
        item.coverPoster, item.accessType, item.priceKopecks, JSON.stringify(item.content), bool(item.published),
        item.position, stamp, stamp,
      ));

      const deleteMissing = (table, ids) => {
        if (!ids.length) {
          db.exec(`DELETE FROM ${table}`);
          return;
        }
        const placeholders = ids.map(() => '?').join(',');
        db.prepare(`DELETE FROM ${table} WHERE id NOT IN (${placeholders})`).run(...ids);
      };
      deleteMissing('academy_materials', materials.map((item) => item.id));
      deleteMissing('academy_courses', courses.map((item) => item.id));
      deleteMissing('academy_categories', categories.map((item) => item.id));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      if (String(error.message).includes('UNIQUE')) {
        const conflict = new Error('Slug должен быть уникальным. Проверьте адреса категорий, курсов и материалов.');
        conflict.status = 409;
        throw conflict;
      }
      throw error;
    }
    return { settings, categories, courses, materials };
  };

  const yookassaRequest = async (pathname, options = {}) => {
    if (!shopId || !secretKey) {
      const error = new Error('ЮKassa ещё не настроена: нужны YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY');
      error.status = 503;
      throw error;
    }
    const response = await fetch(`${yookassaApiUrl}${pathname}`, {
      ...options,
      headers: {
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.description || data.message || `Ошибка ЮKassa: ${response.status}`);
      error.status = response.status >= 500 ? 502 : 400;
      throw error;
    }
    return data;
  };

  const paymentTarget = (type, id) => {
    if (type === 'course') {
      const row = db.prepare('SELECT * FROM academy_courses WHERE id = ? AND published = 1').get(id);
      if (!row || row.access_type !== 'paid' || row.price_kopecks <= 0) return null;
      return { type: 'course', id: row.id, title: row.title, amountKopecks: row.price_kopecks, courseSlug: row.slug };
    }
    if (type === 'material') {
      const row = db.prepare(`
        SELECT materials.*, courses.slug AS course_slug
        FROM academy_materials materials
        JOIN academy_courses courses ON courses.id = materials.course_id AND courses.published = 1
        WHERE materials.id = ? AND materials.published = 1
      `).get(id);
      if (!row || row.access_type !== 'paid' || row.price_kopecks <= 0) return null;
      return {
        type: 'material', id: row.id, title: row.title, amountKopecks: row.price_kopecks,
        courseSlug: row.course_slug, materialSlug: row.slug,
      };
    }
    return null;
  };

  const applyPaymentState = (payment) => {
    if (!payment?.id) return null;
    const localId = trim(payment.metadata?.order_id, 80);
    const local = localId
      ? db.prepare('SELECT * FROM academy_payments WHERE id = ?').get(localId)
      : db.prepare('SELECT * FROM academy_payments WHERE yookassa_id = ?').get(payment.id);
    if (!local || (local.yookassa_id && local.yookassa_id !== payment.id)) return null;
    const remoteAmount = Math.round(Number(payment.amount?.value || 0) * 100);
    if (remoteAmount !== local.amount_kopecks || payment.amount?.currency !== local.currency) {
      throw new Error('Сумма платежа ЮKassa не совпадает с заказом');
    }
    const status = ['pending', 'waiting_for_capture', 'succeeded', 'canceled'].includes(payment.status)
      ? payment.status
      : local.status;
    const paidAt = status === 'succeeded' ? (payment.captured_at || payment.created_at || now()) : local.paid_at;
    db.prepare(`
      UPDATE academy_payments SET yookassa_id = ?, status = ?, payment_method = ?, test = ?, updated_at = ?, paid_at = ?
      WHERE id = ?
    `).run(
      payment.id, status, trim(payment.payment_method?.type, 80), bool(payment.test), now(), paidAt, local.id,
    );
    if (status === 'succeeded') {
      db.prepare(`
        INSERT INTO academy_entitlements (id, user_id, target_type, target_id, payment_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, target_type, target_id) DO NOTHING
      `).run(randomUUID(), local.user_id, local.target_type, local.target_id, local.id, now());
    }
    return db.prepare('SELECT * FROM academy_payments WHERE id = ?').get(local.id);
  };

  const syncPayment = async (row) => {
    if (!row?.yookassa_id) return row;
    const payment = await yookassaRequest(`/payments/${encodeURIComponent(row.yookassa_id)}`);
    return applyPaymentState(payment);
  };

  const readJsonBody = async (request, limit = 3 * 1024 * 1024) => {
    let bytes = 0;
    const chunks = [];
    for await (const chunk of request) {
      bytes += chunk.length;
      if (bytes > limit) {
        const error = new Error('Слишком большой запрос');
        error.status = 413;
        throw error;
      }
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  };

  const handleUpload = async (request, response, json) => {
    const declaredLength = Number(request.headers['content-length'] || 0);
    const maxBytes = 250 * 1024 * 1024;
    if (!declaredLength || declaredLength > maxBytes) {
      json(response, 413, { error: 'Файл должен быть не больше 250 МБ' });
      return;
    }
    const mime = trim(request.headers['content-type'], 120).split(';')[0].toLowerCase();
    const allowed = new Map([
      ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/gif', '.gif'],
      ['video/mp4', '.mp4'], ['video/webm', '.webm'], ['audio/mpeg', '.mp3'], ['audio/ogg', '.ogg'],
      ['audio/wav', '.wav'], ['application/pdf', '.pdf'], ['application/zip', '.zip'],
    ]);
    const extension = allowed.get(mime);
    if (!extension) {
      json(response, 415, { error: 'Поддерживаются JPG, PNG, WebP, GIF, MP4, WebM, MP3, OGG, WAV, PDF и ZIP' });
      return;
    }
    const original = decodeURIComponent(trim(request.headers['x-file-name'], 240) || `file${extension}`);
    const base = slugify(path.parse(original).name, 'file').slice(0, 70);
    const filename = `${Date.now()}-${randomBytes(5).toString('hex')}-${base}${extension}`;
    const temporary = path.join(uploadDir, `${filename}.tmp`);
    const destination = path.join(uploadDir, filename);
    let file;
    try {
      file = await open(temporary, 'wx');
      let received = 0;
      for await (const chunk of request) {
        received += chunk.length;
        if (received > maxBytes) throw Object.assign(new Error('Файл слишком большой'), { status: 413 });
        await file.write(chunk);
      }
      await file.close();
      file = null;
      await rename(temporary, destination);
      json(response, 201, {
        url: `${uploadPublicPath}/${filename}`,
        name: original,
        mime,
        size: received,
        type: mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : 'file',
      });
    } catch (error) {
      await file?.close().catch(() => {});
      await unlink(temporary).catch(() => {});
      throw error;
    }
  };

  const handleAdmin = async (request, response, url, { json }) => {
    await ensureReady();
    if (url.pathname === '/api/admin/academy' && request.method === 'GET') {
      json(response, 200, {
        settings: getSettings(),
        categories: db.prepare('SELECT * FROM academy_categories ORDER BY position, created_at').all().map(adminCategory),
        courses: db.prepare('SELECT * FROM academy_courses ORDER BY position, created_at').all().map(adminCourse),
        materials: db.prepare('SELECT * FROM academy_materials ORDER BY position, created_at').all().map(adminMaterial),
        paymentConfigured: Boolean(shopId && secretKey),
        shopId: shopId ? `${shopId.slice(0, 4)}…${shopId.slice(-3)}` : '',
        webhookUrl: `${publicBaseUrl}/api/yookassa/webhook`,
      });
      return true;
    }
    if (url.pathname === '/api/admin/academy' && request.method === 'POST') {
      const body = await readJsonBody(request, 12 * 1024 * 1024);
      const saved = saveCatalog(body);
      json(response, 200, { ok: true, ...saved });
      return true;
    }
    if (url.pathname === '/api/admin/academy/upload' && request.method === 'POST') {
      await handleUpload(request, response, json);
      return true;
    }
    if (url.pathname === '/api/admin/academy/payments' && request.method === 'GET') {
      const rows = db.prepare(`
        SELECT payments.*, users.email AS account_email
        FROM academy_payments payments
        JOIN academy_users users ON users.id = payments.user_id
        ORDER BY payments.created_at DESC LIMIT 500
      `).all();
      json(response, 200, { payments: rows.map((row) => ({
        id: row.id,
        yookassaId: row.yookassa_id,
        email: row.customer_email,
        name: row.customer_name,
        targetType: row.target_type,
        targetId: row.target_id,
        targetTitle: row.target_title,
        amountKopecks: row.amount_kopecks,
        currency: row.currency,
        status: row.status,
        paymentMethod: row.payment_method,
        test: Boolean(row.test),
        createdAt: row.created_at,
        paidAt: row.paid_at,
      })) });
      return true;
    }
    if (url.pathname === '/api/admin/academy/payment-sync' && request.method === 'POST') {
      const body = await readJsonBody(request);
      const row = db.prepare('SELECT * FROM academy_payments WHERE id = ?').get(trim(body.id, 80));
      if (!row) {
        json(response, 404, { error: 'Платёж не найден' });
        return true;
      }
      const updated = await syncPayment(row);
      json(response, 200, { ok: true, status: updated.status });
      return true;
    }
    return false;
  };

  const handlePublic = async (request, response, url, { json }) => {
    await ensureReady();
    if (url.pathname === '/api/academy/catalog' && request.method === 'GET') {
      json(response, 200, listCatalog(currentUser(request)));
      return true;
    }
    if (url.pathname === '/api/academy/legal' && request.method === 'GET') {
      const type = ['offer', 'privacy', 'consent', 'payment'].includes(url.searchParams.get('type'))
        ? url.searchParams.get('type')
        : 'payment';
      json(response, 200, legalDocument(type));
      return true;
    }
    if (url.pathname === '/api/academy/session' && request.method === 'GET') {
      json(response, 200, { user: currentUser(request) });
      return true;
    }
    if (url.pathname === '/api/academy/register' && request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body.personalDataConsent) {
        json(response, 400, { error: 'Подтвердите отдельное согласие на обработку персональных данных' });
        return true;
      }
      const user = createUser(body.name, body.email, body.password);
      recordLegalAcceptance(user.id, 'registration-personal-data-consent');
      const headers = {};
      createSession(request, headers, user.id);
      json(response, 201, { user }, headers);
      return true;
    }
    if (url.pathname === '/api/academy/login' && request.method === 'POST') {
      const body = await readJsonBody(request);
      const email = trim(body.email, 240).toLowerCase();
      const row = db.prepare('SELECT * FROM academy_users WHERE email = ?').get(email);
      if (!verifyPassword(row, body.password)) {
        json(response, 401, { error: 'Неверный email или пароль' });
        return true;
      }
      const headers = {};
      createSession(request, headers, row.id);
      json(response, 200, { user: { id: row.id, email: row.email, name: row.name } }, headers);
      return true;
    }
    if (url.pathname === '/api/academy/logout' && request.method === 'POST') {
      const token = parseCookies(request).atmika_academy_session;
      if (token) db.prepare('DELETE FROM academy_sessions WHERE token_hash = ?').run(sessionHash(token));
      json(response, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
      return true;
    }
    if (url.pathname === '/api/academy/course' && request.method === 'GET') {
      const slug = slugify(url.searchParams.get('slug'), '');
      const row = db.prepare('SELECT * FROM academy_courses WHERE slug = ? AND published = 1').get(slug);
      if (!row) {
        json(response, 404, { error: 'Курс не найден' });
        return true;
      }
      const category = db.prepare('SELECT * FROM academy_categories WHERE id = ? AND published = 1').get(row.category_id);
      const user = currentUser(request);
      const entitlements = userEntitlements(user?.id);
      const materials = db.prepare('SELECT * FROM academy_materials WHERE course_id = ? AND published = 1 ORDER BY position, created_at')
        .all(row.id)
        .map((material) => ({
          ...publicMaterial(material),
          canAccess: canAccessMaterial(material, row, entitlements),
        }));
      json(response, 200, {
        settings: publicSettings(),
        category: category ? publicCategory(category) : null,
        course: { ...publicCourse(row), content: safeJson(row.content_json, []), owned: entitlements.has(`course:${row.id}`) },
        materials,
        user,
      });
      return true;
    }
    if (url.pathname === '/api/academy/material' && request.method === 'GET') {
      const courseSlug = slugify(url.searchParams.get('course'), '');
      const materialSlug = slugify(url.searchParams.get('slug'), '');
      const row = db.prepare(`
        SELECT materials.*, courses.slug AS course_slug, courses.title AS course_title,
               courses.access_type AS course_access_type, courses.id AS parent_course_id
        FROM academy_materials materials
        JOIN academy_courses courses ON courses.id = materials.course_id AND courses.published = 1
        WHERE courses.slug = ? AND materials.slug = ? AND materials.published = 1
      `).get(courseSlug, materialSlug);
      if (!row) {
        json(response, 404, { error: 'Материал не найден' });
        return true;
      }
      const user = currentUser(request);
      const entitlements = userEntitlements(user?.id);
      const canAccess = canAccessMaterial(row, {
        id: row.parent_course_id,
        access_type: row.course_access_type,
      }, entitlements);
      const adjacent = db.prepare(`
        SELECT slug, title, position FROM academy_materials
        WHERE course_id = ? AND published = 1 ORDER BY position, created_at
      `).all(row.course_id);
      json(response, 200, {
        settings: publicSettings(),
        course: { id: row.parent_course_id, slug: row.course_slug, title: row.course_title, accessType: row.course_access_type },
        material: {
          ...publicMaterial(row),
          canAccess,
          content: canAccess ? safeJson(row.content_json, []) : [],
        },
        adjacent,
        user,
      });
      return true;
    }
    if (url.pathname === '/api/academy/account' && request.method === 'GET') {
      const user = currentUser(request);
      if (!user) {
        json(response, 401, { error: 'Войдите в аккаунт' });
        return true;
      }
      const entitlements = db.prepare(`
        SELECT entitlements.target_type, entitlements.target_id, entitlements.created_at,
               payments.target_title, payments.amount_kopecks
        FROM academy_entitlements entitlements
        JOIN academy_payments payments ON payments.id = entitlements.payment_id
        WHERE entitlements.user_id = ? ORDER BY entitlements.created_at DESC
      `).all(user.id);
      json(response, 200, { user, entitlements, catalog: listCatalog(user) });
      return true;
    }
    if (url.pathname === '/api/academy/checkout' && request.method === 'POST') {
      const body = await readJsonBody(request);
      if (!body.acceptedOffer) {
        json(response, 400, { error: 'Подтвердите принятие публичной оферты' });
        return true;
      }
      if (!body.personalDataConsent) {
        json(response, 400, { error: 'Подтвердите отдельное согласие на обработку персональных данных' });
        return true;
      }
      const target = paymentTarget(body.targetType, trim(body.targetId, 80));
      if (!target) {
        json(response, 400, { error: 'Этот материал нельзя оплатить отдельно' });
        return true;
      }
      let user = currentUser(request);
      const headers = {};
      if (!user) {
        const email = trim(body.email, 240).toLowerCase();
        const existing = db.prepare('SELECT * FROM academy_users WHERE email = ?').get(email);
        if (existing) {
          if (!verifyPassword(existing, body.password)) {
            json(response, 401, { error: 'Для этого email уже есть аккаунт. Укажите его пароль.' });
            return true;
          }
          user = { id: existing.id, email: existing.email, name: existing.name };
        } else {
          user = createUser(body.name, email, body.password);
        }
        createSession(request, headers, user.id);
      }
      recordLegalAcceptance(user.id, 'checkout-offer-acceptance');
      recordLegalAcceptance(user.id, 'checkout-personal-data-consent');
      const owned = userEntitlements(user.id);
      if (owned.has(`${target.type}:${target.id}`)) {
        json(response, 200, {
          alreadyOwned: true,
          destination: target.type === 'course'
            ? `/course/${target.courseSlug}/`
            : `/article/${target.courseSlug}/${target.materialSlug}/`,
        }, headers);
        return true;
      }
      const orderId = randomUUID();
      const stamp = now();
      db.prepare(`
        INSERT INTO academy_payments
          (id, user_id, customer_email, customer_name, target_type, target_id, target_title,
           amount_kopecks, currency, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RUB', 'pending', ?, ?)
      `).run(
        orderId, user.id, user.email, user.name, target.type, target.id, target.title,
        target.amountKopecks, stamp, stamp,
      );
      const settings = getSettings();
      const amountValue = (target.amountKopecks / 100).toFixed(2);
      const requestBody = {
        amount: { value: amountValue, currency: 'RUB' },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: `${publicBaseUrl}/payment/?order_id=${encodeURIComponent(orderId)}`,
        },
        description: trim(`${target.title} — заказ ${orderId.slice(0, 8)}`, 128),
        metadata: {
          order_id: orderId,
          target_type: target.type,
          target_id: target.id,
          user_id: user.id,
        },
      };
      if (receiptsEnabled) {
        requestBody.receipt = {
          customer: { email: user.email },
          items: [{
            description: trim(target.title, 128),
            quantity: '1.00',
            amount: { value: amountValue, currency: 'RUB' },
            vat_code: Number(settings.vatCode || 1),
            payment_mode: 'full_payment',
            payment_subject: 'service',
          }],
        };
      }
      try {
        const payment = await yookassaRequest('/payments', {
          method: 'POST',
          headers: { 'Idempotence-Key': orderId },
          body: JSON.stringify(requestBody),
        });
        db.prepare(`
          UPDATE academy_payments SET yookassa_id = ?, status = ?, confirmation_url = ?, test = ?, updated_at = ?
          WHERE id = ?
        `).run(
          payment.id, payment.status || 'pending', trim(payment.confirmation?.confirmation_url, 2000),
          bool(payment.test), now(), orderId,
        );
        json(response, 201, {
          orderId,
          confirmationUrl: payment.confirmation?.confirmation_url,
          status: payment.status,
        }, headers);
      } catch (error) {
        db.prepare("UPDATE academy_payments SET status = 'canceled', updated_at = ? WHERE id = ?").run(now(), orderId);
        throw error;
      }
      return true;
    }
    if (url.pathname === '/api/academy/payment' && request.method === 'GET') {
      const user = currentUser(request);
      if (!user) {
        json(response, 401, { error: 'Войдите в аккаунт, использованный при оплате' });
        return true;
      }
      let row = db.prepare('SELECT * FROM academy_payments WHERE id = ? AND user_id = ?')
        .get(trim(url.searchParams.get('order_id'), 80), user.id);
      if (!row) {
        json(response, 404, { error: 'Заказ не найден' });
        return true;
      }
      if (row.status === 'pending' && row.yookassa_id && shopId && secretKey) {
        row = await syncPayment(row).catch(() => row);
      }
      let destination = '/account/';
      if (row.status === 'succeeded') {
        const target = paymentTarget(row.target_type, row.target_id);
        if (target) {
          destination = target.type === 'course'
            ? `/course/${target.courseSlug}/`
            : `/article/${target.courseSlug}/${target.materialSlug}/`;
        }
      }
      json(response, 200, {
        orderId: row.id,
        status: row.status,
        title: row.target_title,
        amountKopecks: row.amount_kopecks,
        destination,
      });
      return true;
    }
    if (url.pathname === '/api/yookassa/webhook' && request.method === 'POST') {
      const body = await readJsonBody(request, 1024 * 1024);
      const paymentId = trim(body.object?.id, 120);
      if (!paymentId || !String(body.event || '').startsWith('payment.')) {
        json(response, 200, { ok: true });
        return true;
      }
      const verified = await yookassaRequest(`/payments/${encodeURIComponent(paymentId)}`);
      applyPaymentState(verified);
      json(response, 200, { ok: true });
      return true;
    }
    return false;
  };

  const resolvePage = (pathname) => {
    if (pathname === '/courses' || pathname.startsWith('/courses/')) return path.join(root, 'academy', 'catalog.html');
    if (pathname === '/course' || pathname.startsWith('/course/')) return path.join(root, 'academy', 'course.html');
    if (pathname === '/article' || pathname.startsWith('/article/')) return path.join(root, 'academy', 'article.html');
    if (pathname === '/payment' || pathname.startsWith('/payment/')) return path.join(root, 'academy', 'payment.html');
    if (pathname === '/account' || pathname.startsWith('/account/')) return path.join(root, 'academy', 'account.html');
    if (pathname === '/legal' || pathname.startsWith('/legal/')) return path.join(root, 'academy', 'legal.html');
    return null;
  };

  return {
    handleAdmin,
    handlePublic,
    resolvePage,
    ready: ensureReady,
  };
};
