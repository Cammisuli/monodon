export default function snake_case(str: string): string {
  const chars = str.split('');

  let converted = '';

  for (const char of chars) {
    if (isLetter(char)) {
      converted += char.toLowerCase();
    } else if (isNumber(char)) {
      converted += char;
    } else {
      converted += '_';
    }
  }

  return converted;
}

function isLetter(char: string) {
  return char.toLowerCase() != char.toUpperCase();
}

function isNumber(char: string) {
  const int = parseInt(char, 10);
  return !isNaN(int);
}
