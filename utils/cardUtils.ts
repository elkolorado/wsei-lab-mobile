// utils/cardUtils.ts
export const getExpansionOptions = (cards: any[]) => {
  const uniqueSets = new Set<string>();
  cards.forEach(card => {
    if (card.expansion_id) uniqueSets.add(card.expansion_id.toString());
  });
  return [
    { id: 'All', label: 'All Sets' },
    ...Array.from(uniqueSets).sort().map(set => ({ id: set, label: set }))
  ];
};