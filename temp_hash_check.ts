import bcrypt from 'bcrypt';

async function generateAndLogHash() {
    const password = "adminpass";
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Plaintext password: ${password}`);
    console.log(`Generated hash: ${hashedPassword}`);
}

generateAndLogHash(); 