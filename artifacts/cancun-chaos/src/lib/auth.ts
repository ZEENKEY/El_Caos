export const getPlayerId = (): number | null => {
  const id = localStorage.getItem("cancunChaosPlayerId");
  return id ? parseInt(id, 10) : null;
};

export const setPlayerId = (id: number) => {
  localStorage.setItem("cancunChaosPlayerId", id.toString());
};

export const clearPlayerId = () => {
  localStorage.removeItem("cancunChaosPlayerId");
};
