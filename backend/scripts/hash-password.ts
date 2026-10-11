import readline from 'readline';
import { hashPassword } from '../src/services/argonService.js';

function askQuestion(rl: readline.Interface, query: string, isSecret = true): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(query);

    if (process.stdin.isTTY && isSecret) {
      const stdin = process.stdin;
      let password = '';

      stdin.setRawMode(true);
      stdin.resume();

      const onData = (chunk: Buffer) => {
        const str = chunk.toString();
        for (const char of str) {
          if (char === '\n' || char === '\r' || char === '\u0004') {
            stdin.setRawMode(false);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(password);
            return;
          } else if (char === '\u0003') {
            process.exit();
          } else if (char === '\u007f' || char === '\b') {
            password = password.slice(0, -1);
          } else {
            password += char;
          }
        }
      };

      stdin.on('data', onData);
    } else {
      rl.question('', (answer) => {
        resolve(answer.trim());
      });
    }
  });
}

async function main() {
  console.log('================================================================');
  console.log('       MangaVerse Standalone Admin Password Hashing Utility     ');
  console.log('================================================================');
  console.log('Algorithm: Argon2id (Memory: 19 MiB, Iterations: 2, Parallelism: 1)');
  console.log('Note: This utility does NOT connect to any database.');
  console.log('      Your plaintext password will NOT be logged or saved.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  let password = process.argv[2];
  let confirm = process.argv[3] || password;

  try {
    if (!password) {
      password = await askQuestion(rl, 'Enter admin password: ');
      if (!password || password.length < 8) {
        console.error('Error: Password must be at least 8 characters long.');
        rl.close();
        process.exit(1);
      }
      confirm = await askQuestion(rl, 'Confirm admin password: ');
    }
    rl.close();

    if (password !== confirm) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }

    console.log('Generating secure Argon2id hash...');
    const encodedHash = await hashPassword(password);

    console.log('\n----------------- GENERATED ARGON2ID HASH -----------------');
    console.log(encodedHash);
    console.log('-----------------------------------------------------------\n');

    const nowIso = new Date().toISOString();
    console.log('To manually insert your administrator account in MongoDB Atlas:');
    console.log('1. Open MongoDB Atlas > Databases > Collections.');
    console.log('2. Navigate to your database (e.g., "mangaverse") and collection "users".');
    console.log('3. Click "Insert Document", switch to "{}" (JSON view), and paste:\n');

    const atlasDocExample = {
      username: 'site-admin',
      email: 'admin@example.com',
      passwordHash: encodedHash,
      role: 'admin',
      status: 'active',
      createdAt: { $date: nowIso },
      updatedAt: { $date: nowIso },
    };

    console.log(JSON.stringify(atlasDocExample, null, 2));
    console.log('\nBe sure to replace "admin@example.com" with your actual admin email address.');
    console.log('================================================================');
  } catch (err) {
    rl.close();
    console.error('\nFatal error generating hash:', err);
    process.exit(1);
  }
}

main();
