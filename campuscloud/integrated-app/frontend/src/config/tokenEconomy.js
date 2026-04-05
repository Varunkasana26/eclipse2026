export const TOKEN_ECONOMY = {
  tokenValueInr: 5,
  tokensPerThirtyMinutes: 10,
  providerSharePerThirtyMinutes: 7,
  platformSharePerThirtyMinutes: 3,
  billingIncrementMinutes: 30,
  supportedDurations: [30, 60, 90, 120],
  comingSoonMessage: 'Coming soon in demo mode right now',
};

export function estimateTokenUsage(durationMinutes) {
  const normalizedMinutes = Math.max(
    TOKEN_ECONOMY.billingIncrementMinutes,
    Number(durationMinutes) || TOKEN_ECONOMY.billingIncrementMinutes
  );
  const billingUnits = Math.max(
    1,
    Math.round(normalizedMinutes / TOKEN_ECONOMY.billingIncrementMinutes)
  );
  const totalTokens = billingUnits * TOKEN_ECONOMY.tokensPerThirtyMinutes;
  const providerTokens = billingUnits * TOKEN_ECONOMY.providerSharePerThirtyMinutes;
  const platformTokens = billingUnits * TOKEN_ECONOMY.platformSharePerThirtyMinutes;

  return {
    durationMinutes: billingUnits * TOKEN_ECONOMY.billingIncrementMinutes,
    totalTokens,
    providerTokens,
    platformTokens,
    totalValueInr: totalTokens * TOKEN_ECONOMY.tokenValueInr,
    providerValueInr: providerTokens * TOKEN_ECONOMY.tokenValueInr,
    platformValueInr: platformTokens * TOKEN_ECONOMY.tokenValueInr,
  };
}

export function formatInr(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}
