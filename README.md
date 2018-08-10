## Chanserv

Chanserv is a bot that helps manage channels on a public slack.

### Running the build

Below is a list of all the build scripts available:

<details><summary>Running the build</summary>
<p>

| Npm Script           | Description                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------- |
| `start`              | Does the same as 'npm run serve'. Can be invoked with `npm start`                             |
| `build`              | Full build. Runs ALL build tasks (`build-sass`, `build-ts`, `tslint`, `copy-static-assets`)   |
| `serve`              | Runs node on `dist/server.js` which is the apps entry point                                   |
| `watch-node`         | Runs node with nodemon so the process restarts if it crashes. Used in the main watch task     |
| `watch`              | Runs all watch tasks (TypeScript, Sass, Node). Use this if you're not touching static assets. |
| `test`               | Runs tests using Jest test runner                                                             |
| `watch-test`         | Runs tests in watch mode                                                                      |
| `build-ts`           | Compiles all source `.ts` files to `.js` files in the `dist` folder                           |
| `watch-ts`           | Same as `build-ts` but continuously watches `.ts` files and re-compiles when needed           |
| `build-sass`         | Compiles all `.scss` files to `.css` files                                                    |
| `watch-sass`         | Same as `build-sass` but continuously watches `.scss` files and re-compiles when needed       |
| `tslint`             | Runs TSLint on project files                                                                  |
| `copy-static-assets` | Calls script that copies JS libs, fonts, and images to dist directory                         |
| `debug`              | Performs a full build and then serves the app in watch mode                                   |
| `serve-debug`        | Runs the app with the --inspect flag                                                          |
| `watch-debug`        | The same as `watch` but includes the --inspect flag so you can attach a debugger              |
| `knex`               | Interact with the knex database client. Runs migrations and seeds                             |

</p>
</details>

## Available Commands

Below is a list of all the bot commands available:

<details><summary>Available Commands</summary>
<p>

— _Help_ (_Scope: public_):
Display the available Chanserv commands and their usage. Usage: `!help`

— _Report_ (_Scope: public_):
Ping the server admins to report an incident or ask for help. Usage: `!report`

— _Info_ (_Scope: public_):
Get information about a registered channel. Usage: `!info`

— _Register_ (_Scope: admin_):
Register a channel with Chanserv. Usage: `!register #channel @user`

— _Warn_ (_Scope: op_):
Warn a user that if their behavior continues they will be kicked. Warnings expire after 30 days. Usage: `!warn @user <reason>`

— _Unwarn_ (_Scope: op_):
Expire all active warnings for a user. Usage: `!unwarn @user`

— _Warnings_ (_Scope: public_):
List all warnings for a channel. Usage: `!warnings`

— _Kick_ (_Scope: op_):
Remove a user from a channel. Usage: `!kick @user <reason?>`

— _Ban_ (_Scope: op_):
Ban a user from rejoining a channel. Defaults to 1 hour ban. Usage: `!ban @user <duration?> <reason?>`

— _Unban_ (_Scope: op_):
Expire all active bans for a user. Usage: `!unban @user`

— _Bans_ (_Scope: public_):
List all bans for a channel. Usage: `!bans`

— _Op_ (_Scope: op_):
Add an operator to the channel. An operator has access to kick, ban, op, warn, and other channel commands. Usage: `!op @user`

— _Deop_ (_Scope: op_):
Remove an operator from the channel. Usage: `!deop @user`

— _Whois_ (_Scope: public_):
Display public information about a user. Such as channels, operator status, admin status. Usage: `!whois @user`

— _Remove_ (_Scope: op_):
Remove a message from a channel. Provide a http link to the message and it will be removed. You can find the message link by clicking more actions-> copy link, next to a message. Usage: `!remove <link>`

</p>
</details>

### Todo:

- [ ] Add contributing guide
- [ ] Add getting started guide
- [ ] Add better typing/naming/structure (lol)
- [ ] Add better comments/documentation
- [ ] Add tests for BotService and Repositories
- [ ] Add Web UI with Slack Authentication
