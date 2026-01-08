export const getPrincipalProblem = (description) => {
    if (!description) return "Desafio não descrito.";
    if (description.includes(' || ')) {
        const problemPart = description.split(' || ')[0];
        return problemPart.replace('Desafio principal:', '').trim();
    }
    if (description.includes("Desafio principal:")) {
        return description.split("Perfil:")[0].replace("Desafio principal:", "").trim();
    }
    return description;
};