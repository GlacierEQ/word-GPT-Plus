# Upgrade Options and Prompt Combos

This guide outlines ways to extend Word GPT Plus with optional upgrades and how
to create combinations of built-in prompts.

## Upgrade Options

1. **Embedded Models** – Use local quantized models when privacy or cost is a
   concern.
2. **Commercial API Access** – Unlock higher rate limits and faster models by
   providing your own API keys.
3. **Premium Features** – Enable advanced capabilities such as multiverse
   writing or enhanced image analysis.

Refer to [freemium-options.md](freemium-options.md) for details on transitioning
between free and paid tiers.

## Prompt Combos

Prompt combos chain multiple built-in prompts to automate complex tasks. Example
combos include:

| Combo Name             | Steps                             |
| ---------------------- | --------------------------------- |
| **Summarize & Bullet** | `summary` ➡️ `bullet-points`      |
| **Academic Polish**    | `academic` ➡️ `grammar`           |
| **Creative Rewrite**   | `creatively-rewrite` ➡️ `improve` |

You can create your own combos by sequencing any of the templates defined in
`src/utils/constant.ts`.

To execute a combo manually:

1. Run the first template action from the home page.
2. Copy the generated text and run the next template.

Automated combos will be supported in a future release.
