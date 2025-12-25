
/**
 * Advanced Email Validation Utility
 * blocks garbage domains, common fake patterns, and keyboard smashing
 */

const BLOCKED_DOMAINS = new Set([
    'test.com',
    'example.com',
    'sample.com',
    'email.com',
    'mail.com', // Often used for spam, though some real users exist. Safer to block for high value interactions? Let's keep it for now as "suspicious"
    'localhost',
    'asdasd.com',
    'qweqwe.com',
    '123.com',
    'abc.com'
]);

const BLOCKED_LOCAL_PARTS = new Set([
    'test',
    'tester',
    'admin',
    'user',
    'usuario',
    'asdasd',
    'qwerty',
    'qweqwe',
    '123456',
    '1234',
    '123',
    'abc',
    'email',
    'mail',
    'info',
    'noreply',
    'no-reply'
]);

export function isValidEmail(email: string): boolean {
    if (!email || email.length > 254) return false;

    const trimmedEmail = email.toLowerCase().trim();

    // 1. Strict Regex for format
    // checks for standard user@domain.tld format
    // avoids spaces, requires dot in domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) return false;

    const [localPart, domain] = trimmedEmail.split('@');

    // 2. Check Blocked Domains
    if (BLOCKED_DOMAINS.has(domain)) return false;

    // extra check for "garbage" domains like "asdasds.com" (keyboard smash)
    // simple heuristic: if domain part (before tld) is all consonants or weird patterns
    const domainName = domain.split('.')[0];
    if (isKeyboardSmash(domainName)) return false;

    // 3. Check Blocked Local Parts
    if (BLOCKED_LOCAL_PARTS.has(localPart)) return false;

    // 4. Check for Keyboard Smashing / Low Entropy in local part
    if (isKeyboardSmash(localPart)) return false;

    // 5. Check for repeating characters (e.g. aaaaaa@gmail.com)
    if (hasRepeatingChars(localPart, 4)) return false;

    return true;
}

/**
 * Detects keyboard smashing or highly suspicious random strings
 * e.g. "asdfgh", "qwer", "lkjhg"
 */
function isKeyboardSmash(str: string): boolean {
    if (str.length < 4) return false; // short strings are hard to judge

    // Common keyboard rows (QWERTY)
    const rows = [
        'qwertyuiop',
        'asdfghjkl',
        'zxcvbnm'
    ];

    // check if string is a substring of any row (forward or reverse)
    for (const row of rows) {
        if (row.includes(str) || row.split('').reverse().join('').includes(str)) {
            return true;
        }
    }

    return false;
}

function hasRepeatingChars(str: string, maxRepeat: number): boolean {
    const regex = new RegExp(`(.)\\1{${maxRepeat - 1},}`);
    return regex.test(str);
}
