# Taste

Give Paseo some Taste.

Taste is a plugin for [Paseo](https://paseo.sh).

## Requirements

Paseo 0.17.0-beta.1 or newer, with plugins enabled (**Settings → Plugins → Enable plugins**).

## Install from source

```bash
paseo plugin add git:hlebtkachenko/paseo-taste
```

## Develop

```bash
npm install
npm run typecheck
paseo plugin install "$PWD"   # first time
paseo plugin reload taste     # after each change
```

Plugin docs: https://paseo.sh/docs/plugins

## License

MIT
