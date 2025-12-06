/**
 * Generates a random 6-character confirmation code (alphanumeric)
 * Used for critical actions that require user confirmation
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like 0, O, 1, I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
