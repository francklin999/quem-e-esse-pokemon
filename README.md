# Quem é esse Pokémon?

Jogo de adivinhação inspirado no quadro clássico “Quem é esse Pokémon?”. Desenvolvido com HTML, CSS e JavaScript puro, sem frameworks.

## Como funciona

- Um Pokémon aleatório da primeira geração aparece como uma silhueta com brilho 0%.
- Cada nome incorreto consome uma das três vidas.
- As letras do chute que também existem no nome correto são reveladas, como em uma forca.
- O brilho sobe para 25% após o primeiro erro e 50% após o segundo.
- Ao acertar ou perder a terceira vida, o Pokémon é revelado por completo.
- Sequência de vitórias e recorde ficam salvos no navegador.

## Executar

Como o jogo consulta a PokéAPI, abra-o por um servidor HTTP local:

```bash
npx serve .
```

## Publicação

O workflow em `.github/workflows/deploy-pages.yml` publica o jogo automaticamente no GitHub Pages a cada push na branch `main`.

## Fonte dos dados

Pokémon, nomes e imagens são obtidos da [PokéAPI](https://pokeapi.co/docs/v2).
