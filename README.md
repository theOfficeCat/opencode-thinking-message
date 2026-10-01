# opencode-thinking-message

TUI plugin for [opencode](https://opencode.ai) that replaces the reasoning
header with a rotating message while the model is thinking.

Instead of a static header you get lines like:

> **waiting on the ROB**
>
> The user wants to add a button to the header component...

Every reasoning part gets its own message, cycling through the built-in list of
320 CPU/FPGA/ASIC-flavoured phrases (`hitting in L1`, `walking the page table`,
`closing timing`, `taping out`, ...). When a part finishes, the original header
is restored unless `keepAfterEnd` is set.

## Install

TUI plugins live in `tui.json`, not `opencode.json`. Add the package to the
`plugin` array of your global config at `~/.config/opencode/tui.json`:

```json
{
  "plugin": ["opencode-thinking-message"]
}
```

Restart opencode after changing the file; config is only read at startup.

## Options

Pass options with the tuple form:

```json
{
  "plugin": [
    [
      "opencode-thinking-message",
      {
        "texts": ["renaming registers", "hitting in L2", "finding the bottleneck"],
        "keepAfterEnd": false
      }
    ]
  ]
}
```

| Option         | Type       | Default  | Description                                                                 |
| -------------- | ---------- | -------- | --------------------------------------------------------------------------- |
| `enabled`      | `boolean`  | `true`   | Set to `false` to disable the plugin without removing it from the config.   |
| `texts`        | `string[]` | built-in | Messages to rotate through.                                                 |
| `text`         | `string`   | built-in | Single message, used when `texts` is absent or empty.                       |
| `keepAfterEnd` | `boolean`  | `false`  | Keep the message after the reasoning part ends instead of restoring it.     |

Messages are normalized (whitespace collapsed, markdown stripped, duplicates
removed). If no option is given, the plugin falls back to the value stored
under the `thinking_message` key of the TUI key-value store, and finally to the
built-in list, so it works with zero configuration.

## Development

```sh
npm install
npm run typecheck
npm test
npm run build
```

To use a local checkout before publishing, point `tui.json` at the built entry:

```json
{
  "plugin": ["file:///absolute/path/to/opencode-thinking-message/dist/tui.js"]
}
```

TUI plugins are resolved from the `exports["./tui"]` entry of the package.

## License

MIT
