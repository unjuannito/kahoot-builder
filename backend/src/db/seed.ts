import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { schema } from './schema.js';
import crypto from 'crypto';

// Utility to generate UUID v4
function generateUuid(): string {
  return crypto.randomUUID();
}

// Utility to format datetime for SQLite
function dateTime(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

// Utility to generate random index from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seed(db: Database.Database) {
  console.log('🌱 Starting database seeding...');

  // Names pools for generating users
  const firstNames = [
    'Juan', 'María', 'John', 'Ana', 'Carlos', 'Laura', 'Pedro', 'Sofía',
    'Diego', 'Elena', 'Pablo', 'Claudia', 'Andrés', 'Valentina', 'Mateo',
    'Lucía', 'Fernando', 'Isabella', 'Ricardo', 'Camila'
  ];

  const lastNames = [
    'Díaz', 'García', 'Smith', 'López', 'Martínez', 'Rodríguez', 'Hernández', 'Gómez',
    'Fernández', 'González', 'Wilson', 'Brown', 'Taylor', 'Anderson', 'Thomas',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Perez'
  ];

  const domains = ['example.com', 'test.org', 'mail.com', 'demo.net'];
  const languages = ['es', 'en', 'pt'];

  // ==========================================
  // 1. CREATE 12 TEST USERS
  // ==========================================
  const numUsers = 12;
  const users: Array<{
    id: string;
    email: string;
    password_hash: string | null;
    name: string;
    language_code: string;
    is_active: number;
    email_verified_at: string;
    last_login_at: string;
  }> = [];

  for (let i = 0; i < numUsers; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domains[i % domains.length]}`;
    const isInactive = i === numUsers - 1; // Last user is inactive

    users.push({
      id: generateUuid(),
      email,
      password_hash: isInactive ? null : `$2b$10$ExampleHashUser${i}abcdefghijklmnopqrstuvwxyz`,
      name,
      language_code: languages[i % languages.length],
      is_active: isInactive ? 0 : 1,
      email_verified_at: dateTime(new Date('2026-01-15T10:30:00Z')),
      last_login_at: dateTime(new Date('2026-07-20T14:22:00Z')),
    });
  }

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name, language_code, is_active, email_verified_at, last_login_at, created_at, updated_at)
    VALUES (@id, @email, @password_hash, @name, @language_code, @is_active, @email_verified_at, @last_login_at, @created_at, @updated_at)
  `);

  const createdAt = dateTime(new Date('2026-01-01T00:00:00Z'));
  const bulkInsertUser = db.transaction((usersArr: typeof users) => {
    usersArr.forEach(user => insertUser.run({ ...user, created_at: createdAt, updated_at: createdAt }));
  });

  console.log(`   📝 Inserting ${users.length} users...`);
  bulkInsertUser(users);

  // ==========================================
  // 2. CREATE USER CONNECTIONS (Google OAuth) - for first 8 users
  // ==========================================
  const userConnections: Array<{
    id: string;
    user_id: string;
    provider_id: string;
    provider_user_id: string;
    provider_email: string;
  }> = [];

  for (let i = 0; i < Math.min(8, users.length); i++) {
    userConnections.push({
      id: generateUuid(),
      user_id: users[i].id,
      provider_id: 'google',
      provider_user_id: `${112233 + i}44556677889900${i}`,
      provider_email: users[i].email,
    });
  }

  const insertConnection = db.prepare(`
    INSERT OR IGNORE INTO user_connections (id, user_id, provider_id, provider_user_id, provider_email, created_at)
    VALUES (@id, @user_id, @provider_id, @provider_user_id, @provider_email, @created_at)
  `);

  const bulkInsertConnections = db.transaction((connections: typeof userConnections) => {
    connections.forEach(conn => insertConnection.run({ ...conn, created_at: dateTime(new Date('2026-01-01T00:00:00Z')) }));
  });

  console.log(`   🔗 Inserting ${userConnections.length} user connections...`);
  bulkInsertConnections(userConnections);

  // ==========================================
  // 3. CREATE AUTH SESSIONS - for first 6 users
  // ==========================================
  const authSessions: Array<{
    id: string;
    user_id: string;
    refresh_token_hash: string;
    expires_at: string;
  }> = [];

  for (let i = 0; i < Math.min(6, users.length); i++) {
    authSessions.push({
      id: generateUuid(),
      user_id: users[i].id,
      refresh_token_hash: crypto.createHash('sha256').update(`refresh-token-user-${i}-123`).digest('hex'),
      expires_at: dateTime(new Date('2026-08-20T14:22:00Z')),
    });
  }

  const insertAuthSession = db.prepare(`
    INSERT OR IGNORE INTO auth_sessions (id, user_id, refresh_token_hash, expires_at, created_at, last_used_at, device_info, ip_address)
    VALUES (@id, @user_id, @refresh_token_hash, @expires_at, @created_at, @last_used_at, @device_info, @ip_address)
  `);

  console.log(`   🔑 Inserting ${authSessions.length} auth sessions...`);
  authSessions.forEach(session => {
    insertAuthSession.run({
      ...session,
      created_at: dateTime(new Date('2026-07-20T00:00:00Z')),
      last_used_at: dateTime(new Date('2026-07-22T00:00:00Z')),
      device_info: JSON.stringify({ os: 'Windows 11', browser: 'Chrome 135' }),
      ip_address: '192.168.1.100',
    });
  });

  // ==========================================
  // 4. CREATE ACCOUNT DELETION TASKS (for inactive user)
  // ==========================================
  const accountDeletionTasks = [
    {
      id: generateUuid(),
      user_id: users[numUsers - 1].id,
      scheduled_for: dateTime(new Date('2026-07-29T12:00:00Z')),
    },
  ];

  const insertAccountDeletionTask = db.prepare(`
    INSERT OR IGNORE INTO account_deletion_tasks (id, user_id, scheduled_for, created_at)
    VALUES (@id, @user_id, @scheduled_for, @created_at)
  `);

  console.log(`   🗑️ Inserting ${accountDeletionTasks.length} account deletion tasks...`);
  accountDeletionTasks.forEach(task => {
    insertAccountDeletionTask.run({ ...task, created_at: dateTime(new Date('2026-07-22T12:00:00Z')) });
  });

  // ==========================================
  // 5. CREATE KAHOOT SESSIONS (QUIZZES) - Each quiz has 4-16 users and 8-16 questions per user
  // ==========================================

  // Create 3 quizzes with varying player counts (4, 8, 12)
  const quizPlayerCounts = [4, 8, 12];
  const kahootSessions: Array<{
    id: string;
    code: string;
    visibility: 'all_questions' | 'only_own';
    expires_at: string;
  }> = [];

  for (let i = 0; i < quizPlayerCounts.length; i++) {
    kahootSessions.push({
      id: generateUuid(),
      code: `${String(i + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 9)).padStart(3, '0')}${String(Math.floor(Math.random() * 9)).padStart(2, '0')}`,
      visibility: i === 0 ? 'all_questions' : 'only_own',
      expires_at: dateTime(new Date('2026-12-31T23:59:59Z')),
    });
  }

  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO sessions (id, code, visibility, created_at, expires_at)
    VALUES (@id, @code, @visibility, @created_at, @expires_at)
  `);

  console.log(`   🎮 Inserting ${kahootSessions.length} kahoot sessions...`);
  kahootSessions.forEach(session => {
    insertSession.run({
      ...session,
      created_at: dateTime(new Date('2026-07-15T10:00:00Z')),
    });
  });

  // Question pools for generating questions
  const questionTemplates = [
    { question: '¿Cuál es la capital de Francia?', option1: 'Londres', option2: 'Madrid', option3: 'París', option4: 'Berlín', correct: '3' },
    { question: '¿Cuánto es 5 x 6?', option1: '30', option2: '25', option3: '35', option4: '40', correct: '1' },
    { question: '¿Cuál es el océano más grande?', option1: 'Atlántico', option2: 'Pacífico', option3: 'Índico', option4: 'Ártico', correct: '2' },
    { question: '¿Quién escribió Don Quijote?', option1: 'Cervantes', option2: 'Shakespeare', option3: 'Dante', option4: 'Homer', correct: '1' },
    { question: '¿Cuál es el elemento con símbolo "Fe"?', option1: 'Plata', option2: 'Hierro', option3: 'Oro', option4: 'Cobre', correct: '2' },
    { question: '¿En qué continente está Egipto?', option1: 'Asia', option2: 'Europa', option3: 'África', option4: 'América', correct: '3' },
    { question: '¿Cuántos lados tiene un hexágono?', option1: '5', option2: '6', option3: '7', option4: '8', correct: '2' },
    { question: '¿Cuál es el río más largo de Europa?', option1: 'Nilo', option2: 'Volga', option3: 'Danubio', option4: 'Sena', correct: '2' },
    { question: '¿Qué gas respiramos?', option1: 'CO2', option2: 'Nitrógeno', option3: 'Oxígeno', option4: 'Hidrógeno', correct: '3' },
    { question: '¿Cuál es el país más grande?', option1: 'China', option2: 'USA', option3: 'Rusia', option4: 'Canadá', correct: '3' },
    { question: '¿Cuánto es 100 - 37?', option1: '63', option2: '73', option3: '53', option4: '83', correct: '1' },
    { question: '¿Cuál es el metal líquido a temperatura ambiente?', option1: 'Mercurio', option2: 'Plomo', option3: 'Aluminio', option4: 'Acero', correct: '1' },
    { question: '¿Quién pintió la Última Cena?', option1: 'Da Vinci', option2: 'Picasso', option3: 'Van Gogh', option4: 'Monet', correct: '1' },
    { question: '¿Cuál es el animal más rápido?', option1: 'León', option2: 'Guepardo', option3: 'Águila', option4: 'Caballo', correct: '2' },
    { question: '¿Cuántos continentes hay?', option1: '5', option2: '6', option3: '7', option4: '8', correct: '3' },
    { question: '¿Cuál es la montañ más alta?', option1: 'K2', option2: 'Everest', option3: 'Kangchenjunga', option4: 'Lhotse', correct: '2' },
    { question: '¿Qué estudia la botánica?', option1: 'Animales', option2: 'Plantas', option3: 'Rocas', option4: 'Estrellas', correct: '2' },
    { question: '¿Cuánto es 7 x 8?', option1: '48', option2: '54', option3: '56', option4: '63', correct: '3' },
    { question: '¿Cuál es el idioma más hablado?', option1: 'Español', option2: 'Inglés', option3: 'Chino', option4: 'Hindi', correct: '2' },
    { question: '¿Qué instrumento toca un pianista?', option1: 'Violín', option2: 'Piano', option3: 'Flauta', option4: 'Trompeta', correct: '2' },
  ];

  // Create users with questions for each quiz session
  const allQuestions: Array<{
    id: string;
    session_id: string;
    user_id: string;
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    time: number;
    correct: string;
  }> = [];

  const insertQuestion = db.prepare(`
    INSERT OR IGNORE INTO questions (id, session_id, user_id, question, option1, option2, option3, option4, time, correct, created_at)
    VALUES (@id, @session_id, @user_id, @question, @option1, @option2, @option3, @option4, @time, @correct, @created_at)
  `);

  let questionCounter = 0;

  console.log(`   ❓ Inserting questions per quiz...`);

  for (let quizIdx = 0; quizIdx < kahootSessions.length; quizIdx++) {
    const session = kahootSessions[quizIdx];
    const playerCount = quizPlayerCounts[quizIdx];

    // Select players for this quiz (8-16 questions per user)
    const selectedUsers = users.slice(0, playerCount);

    for (let userIdx = 0; userIdx < selectedUsers.length; userIdx++) {
      const user = selectedUsers[userIdx];

      // Each user creates between 8 and 16 questions
      const numQuestionsForUser = 8 + Math.floor(Math.random() * 9); // 8 to 16

      for (let q = 0; q < numQuestionsForUser && q < questionTemplates.length; q++) {
        const template = questionTemplates[q];
        allQuestions.push({
          id: generateUuid(),
          session_id: session.id,
          user_id: user.id,
          question: template.question,
          option1: template.option1,
          option2: template.option2,
          option3: template.option3,
          option4: template.option4,
          correct: template.correct,
          time: 20 + Math.floor(Math.random() * 25), // 20-45 seconds
        });
        questionCounter++;
      }

      // If we need more questions (to reach 16) and templates are exhausted, reuse with variations
      if (numQuestionsForUser > questionTemplates.length) {
        const remaining = numQuestionsForUser - questionTemplates.length;
        for (let q = 0; q < remaining; q++) {
          const template = questionTemplates[q % questionTemplates.length];
          allQuestions.push({
            id: generateUuid(),
            session_id: session.id,
            user_id: user.id,
            question: `${template.question} (v${Math.floor(q / questionTemplates.length) + 2})`,
            option1: template.option1,
            option2: template.option2,
            option3: template.option3,
            option4: template.option4,
            correct: template.correct,
            time: 20 + Math.floor(Math.random() * 25),
          });
          questionCounter++;
        }
      }
    }
  }

  console.log(`   ❓ Inserting ${allQuestions.length} total questions...`);
  allQuestions.forEach(q => {
    insertQuestion.run({ ...q, created_at: dateTime(new Date('2026-07-15T12:00:00Z')) });
  });

  // ==========================================
  // 6. CREATE SESSION USERS (players joined sessions)
  // ==========================================
  const sessionUsers: Array<{
    id: string;
    session_id: string;
    user_id: string;
    is_owner: number;
    left_at?: string | null;
  }> = [];

  for (let quizIdx = 0; quizIdx < kahootSessions.length; quizIdx++) {
    const session = kahootSessions[quizIdx];
    const playerCount = quizPlayerCounts[quizIdx];
    const selectedUsers = users.slice(0, playerCount);

    selectedUsers.forEach((user, idx) => {
      sessionUsers.push({
        id: generateUuid(),
        session_id: session.id,
        user_id: user.id,
        is_owner: idx === 0 ? 1 : 0, // First user is the owner
        left_at: (idx > 0 && Math.random() < 0.2) ? dateTime(new Date('2026-07-16T15:00:00Z')) : null,
      });
    });
  }

  const insertSessionUser = db.prepare(`
    INSERT OR IGNORE INTO session_users (id, session_id, user_id, is_owner, joined_at, left_at)
    VALUES (@id, @session_id, @user_id, @is_owner, @joined_at, @left_at)
  `);

  console.log(`   👥 Inserting ${sessionUsers.length} session users...`);
  sessionUsers.forEach(su => {
    insertSessionUser.run({
      ...su,
      joined_at: dateTime(new Date('2026-07-15T14:00:00Z')),
      left_at: su.left_at ?? null,
    });
  });

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n✅ Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - User Connections: ${userConnections.length}`);
  console.log(`   - Auth Sessions: ${authSessions.length}`);
  console.log(`   - Account Deletion Tasks: ${accountDeletionTasks.length}`);
  console.log(`   - Kahoot Sessions: ${kahootSessions.length}`);
  console.log(`   - Total Questions: ${allQuestions.length}`);
  console.log(`   - Session Users: ${sessionUsers.length}`);

  // Per-quiz breakdown
  console.log('\n📋 Per-Quiz Breakdown:');
  for (let quizIdx = 0; quizIdx < kahootSessions.length; quizIdx++) {
    const session = kahootSessions[quizIdx];
    const playerCount = quizPlayerCounts[quizIdx];
    const questionsForQuiz = allQuestions.filter(q => q.session_id === session.id);

    // Questions per user
    const questionsPerUser: Record<string, number> = {};
    questionsForQuiz.forEach(q => {
      questionsPerUser[q.user_id] = (questionsPerUser[q.user_id] || 0) + 1;
    });

    const minQ = Math.min(...Object.values(questionsPerUser));
    const maxQ = Math.max(...Object.values(questionsPerUser));

    console.log(`   Quiz ${session.code}: ${playerCount} players, ${questionsForQuiz.length} total questions (${minQ}-${maxQ} per user)`);
  }
}

// Main execution
const db = new Database(config.dbPath);
db.pragma('foreign_keys = ON');
db.exec(schema);

seed(db);

db.close();

console.log('\n👋 Database connection closed.');
