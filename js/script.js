"use strict";

const API_URL = "https://pokeapi.co/api/v2/pokemon";
const MAX_POKEMON = 151;
const MAX_LIVES = 3;

const elements = {
  form: document.querySelector("#guess-form"),
  input: document.querySelector("#guess"),
  image: document.querySelector("#pokemon-image"),
  loading: document.querySelector("#loading"),
  maskedName: document.querySelector("#masked-name"),
  letterCount: document.querySelector("#letter-count"),
  lives: document.querySelector("#lives"),
  brightness: document.querySelector("#brightness-label"),
  feedback: document.querySelector("#feedback"),
  attempts: document.querySelector("#attempts"),
  attemptsCount: document.querySelector("#attempts-count"),
  pokemonNumber: document.querySelector("#pokemon-number"),
  streak: document.querySelector("#streak"),
  bestScore: document.querySelector("#best-score"),
  dialog: document.querySelector("#result-dialog"),
  resultBadge: document.querySelector("#result-badge"),
  resultKicker: document.querySelector("#result-kicker"),
  resultTitle: document.querySelector("#result-title"),
  resultImage: document.querySelector("#result-image"),
  resultCopy: document.querySelector("#result-copy"),
  nextButton: document.querySelector("#next-pokemon"),
  submitButton: document.querySelector('#guess-form button[type="submit"]'),
};

const state = {
  pokemon: null,
  lives: MAX_LIVES,
  revealedLetters: new Set(),
  attempts: [],
  streak: 0,
  bestScore: Number(localStorage.getItem("pokeguess-best") || 0),
  lastPokemonId: null,
};

const normalize = (text) => text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function renderLives() {
  elements.lives.replaceChildren();
  for (let index = 0; index < MAX_LIVES; index += 1) {
    const life = document.createElement("span");
    life.className = `life${index >= state.lives ? " lost" : ""}`;
    life.innerHTML = '<svg viewBox="0 0 24 22" aria-hidden="true"><path fill="currentColor" d="M12 21S1 14.2 1 7.2C1 3.8 3.5 1 6.8 1 9 1 10.8 2.2 12 4c1.2-1.8 3-3 5.2-3C20.5 1 23 3.8 23 7.2 23 14.2 12 21 12 21Z"/></svg>';
    elements.lives.append(life);
  }
  elements.lives.setAttribute("aria-label", `${state.lives} ${state.lives === 1 ? "vida restante" : "vidas restantes"}`);
}

function renderMaskedName(revealAll = false) {
  const name = state.pokemon.name;
  elements.maskedName.textContent = [...name].map((letter) => revealAll || letter === "-" || state.revealedLetters.has(letter) ? letter : "─").join("");
  elements.letterCount.textContent = `${name.length} ${name.length === 1 ? "letra" : "letras"}`;
}

function renderAttempts() {
  elements.attempts.replaceChildren();
  if (!state.attempts.length) {
    const empty = document.createElement("li");
    empty.className = "empty-attempt";
    empty.textContent = "Nenhum chute ainda";
    elements.attempts.append(empty);
  } else {
    state.attempts.forEach((attempt) => {
      const item = document.createElement("li");
      item.textContent = attempt;
      elements.attempts.append(item);
    });
  }
  elements.attemptsCount.textContent = `${state.attempts.length} de ${MAX_LIVES}`;
}

function setBrightness(value) {
  elements.image.style.filter = `brightness(${value / 100})`;
  elements.brightness.textContent = `${value}%`;
  elements.image.classList.remove("bump");
  requestAnimationFrame(() => elements.image.classList.add("bump"));
}

function revealGuessLetters(guess) {
  [...guess].forEach((letter) => {
    if (state.pokemon.name.includes(letter)) state.revealedLetters.add(letter);
  });
}

function finishRound(won) {
  setBrightness(100);
  renderMaskedName(true);
  elements.input.disabled = true;
  elements.submitButton.disabled = true;
  if (won) {
    state.streak += 1;
    state.bestScore = Math.max(state.bestScore, state.streak);
    localStorage.setItem("pokeguess-best", String(state.bestScore));
  } else {
    state.streak = 0;
  }
  elements.streak.textContent = state.streak;
  elements.bestScore.textContent = state.bestScore;
  elements.resultBadge.textContent = won ? "✓" : "!";
  elements.resultBadge.classList.toggle("lost", !won);
  elements.resultKicker.textContent = won ? "VOCÊ CONSEGUIU!" : "NÃO FOI DESSA VEZ";
  elements.resultTitle.textContent = `Era ${titleCase(state.pokemon.name)}!`;
  elements.resultCopy.textContent = won ? `Você descobriu com ${state.attempts.length || 1} tentativa(s).` : "Suas vidas acabaram. Prepare-se para o próximo desafio!";
  elements.resultImage.src = state.pokemon.image;
  elements.resultImage.alt = state.pokemon.name;
  window.setTimeout(() => elements.dialog.showModal(), 650);
}

function handleGuess(event) {
  event.preventDefault();
  const guess = normalize(elements.input.value);

  if (!guess) {
    elements.feedback.textContent = "Digite um nome antes de chutar.";
    elements.feedback.className = "feedback error";
    elements.input.focus();
    return;
  }

  if (state.attempts.includes(guess)) {
    elements.feedback.textContent = "Você já tentou esse Pokémon.";
    elements.feedback.className = "feedback error";
    elements.input.select();
    return;
  }

  state.attempts.push(guess);
  renderAttempts();
  elements.input.value = "";

  if (guess === state.pokemon.name) {
    elements.feedback.textContent = "Acertou! Pokédex atualizada.";
    elements.feedback.className = "feedback success";
    finishRound(true);
    return;
  }

  revealGuessLetters(guess);
  renderMaskedName();

  if (state.pokemon.name === elements.maskedName.textContent) {
    elements.feedback.textContent = "Você revelou todas as letras!";
    elements.feedback.className = "feedback success";
    finishRound(true);
    return;
  }

  state.lives -= 1;
  renderLives();

  if (state.lives === 0) {
    elements.feedback.textContent = "Suas vidas acabaram.";
    elements.feedback.className = "feedback error";
    finishRound(false);
    return;
  }

  setBrightness(state.attempts.length * 25);
  elements.feedback.textContent = "Não é esse. As letras em comum foram reveladas!";
  elements.feedback.className = "feedback error";
  elements.input.focus();
}

async function loadPokemon() {
  elements.loading.classList.remove("hidden");
  elements.input.disabled = true;
  elements.submitButton.disabled = true;
  let randomId;
  do randomId = Math.floor(Math.random() * MAX_POKEMON) + 1;
  while (randomId === state.lastPokemonId);
  try {
    const response = await fetch(`${API_URL}/${randomId}`);
    if (!response.ok) throw new Error("Falha ao consultar a PokéAPI");
    const data = await response.json();
    const image = data.sprites.other["official-artwork"].front_default || data.sprites.front_default;
    state.pokemon = { id: data.id, name: normalize(data.name), image };
    state.lastPokemonId = data.id;
    state.lives = MAX_LIVES;
    state.revealedLetters.clear();
    state.attempts = [];
    elements.image.src = image;
    await elements.image.decode().catch(() => {});
    elements.pokemonNumber.textContent = String(data.id).padStart(3, "0");
    elements.image.alt = `Silhueta de um Pokémon misterioso com ${state.pokemon.name.length} letras`;
    renderLives();
    renderMaskedName();
    renderAttempts();
    setBrightness(0);
    elements.feedback.textContent = "Digite o nome de qualquer Pokémon.";
    elements.feedback.className = "feedback";
    elements.loading.classList.add("hidden");
    elements.input.disabled = false;
    elements.submitButton.disabled = false;
    elements.input.focus();
  } catch {
    elements.loading.textContent = "Não foi possível carregar. Tente novamente.";
    elements.nextButton.textContent = "Tentar novamente";
    elements.dialog.showModal();
  }
}

elements.form.addEventListener("submit", handleGuess);
elements.nextButton.addEventListener("click", () => {
  elements.dialog.close();
  elements.nextButton.textContent = "Próximo Pokémon";
  loadPokemon();
});
elements.dialog.addEventListener("cancel", (event) => event.preventDefault());
elements.bestScore.textContent = state.bestScore;
loadPokemon();
