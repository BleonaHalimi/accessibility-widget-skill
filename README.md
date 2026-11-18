# Accessibility Widget skill

An agent skill that adds a self-hosted, open-source accessibility preferences widget to any website, and fixes the site's real accessibility problems first.

When you ask your AI coding assistant to "add an accessibility widget", the skill makes it:

1. Detect your framework (HTML, React, Next.js, Vue, Nuxt, Angular, SvelteKit, Astro, WordPress, Shopify, Drupal, Django, Rails, Laravel).
2. Run an axe audit and fix existing issues (alt text, labels, focus, contrast, landmarks).
3. Set up environment variables and a Content-Security-Policy that stays strict.
4. Install the widget: two dependency-free files, about 300 lines in total.
5. Wire it into your framework the right way (client-only, no SSR errors).
6. Verify it with keyboard checks and a Playwright + axe test.

The widget lets visitors change text size, contrast, grayscale, link underlining, font, text spacing, animations and focus highlighting. Their choices are saved in the browser.

> **The widget is not a compliance fix.** It does not make a site WCAG, ADA or EAA compliant. Screen reader and keyboard users rely on correct HTML, which is why the skill audits and fixes the site before installing anything.

## Install

### Claude Code

```
/plugin marketplace add BleonaHalimi/accessibility-widget-skill
/plugin install accessibility-widget@accessibility-widget
```

Or copy the skill folder by hand:

```bash
git clone https://github.com/BleonaHalimi/accessibility-widget-skill
cp -r accessibility-widget-skill/skills/accessibility-widget ~/.claude/skills/
```

### Claude.ai and the Claude desktop app

Download `accessibility-widget.zip` from the [latest release](https://github.com/BleonaHalimi/accessibility-widget-skill/releases/latest) and upload it under **Settings → Capabilities → Skills**.

### Codex, Cursor, Gemini CLI, GitHub Copilot and other agents

With the cross-agent [`skills`](https://www.npmjs.com/package/skills) installer:

```bash
npx skills add BleonaHalimi/accessibility-widget-skill
```

For a tool without skill support, add [`skills/accessibility-widget/SKILL.md`](skills/accessibility-widget/SKILL.md) to its rules or instructions file (for example `AGENTS.md`), or paste it into the chat.

## Usage

Open your project and ask:

> Add an accessibility widget to this site.

## Just want the widget?

The files are in [`skills/accessibility-widget/assets/`](skills/accessibility-widget/assets/). Add them to any page:

```html
<link rel="stylesheet" href="/a11y-widget.css">
<script src="/a11y-widget.js" defer></script>
```

See [SKILL.md](skills/accessibility-widget/SKILL.md) for configuration, framework recipes and known limitations.

## License

[MIT](LICENSE)
