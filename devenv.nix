{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  name = "likec4-dev-env";
  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs_20;
      pnpm = {
        enable = true;
      };
    };
    typescript.enable = true;
    nix.enable = true;
  };

  packages = [
    pkgs.chafa
    pkgs.eza
    pkgs.bat
  ];

  scripts.hello.exec = ''
    # figlet  Hello from $GREET | lolcat
    chafa ${config.env.DEVENV_ROOT}/cover.png
  '';

  enterShell = ''
    alias l='eza -alh  --icons=auto' # long list
    alias ls='eza -a -1   --icons=auto' # short list
    alias ll='eza -lha --icons=auto --sort=name --group-directories-first' # long list all
    alias ld='eza -lhD --icons=auto' # long list dirs
    alias lt='eza --icons=auto --tree' # list folder as tree
    alias cat='bat'
    alias mkdir='mkdir -p'

    hello
  '';

  enterTest = ''
    set -ex
    echo "Running tests"

    git --version | grep --color=auto "${pkgs.git.version}"

    process-compose down

    pnpm d
    figlet "Tests Completed 🥳" | lolcat
  '';

  process = {
    manager.args = {"theme"="One Dark";};
    managers.process-compose.settings.processes = {
      docs = {
        command = "pnpm --filter docs-astro dev";
        description = "📚 Docs | 4321 | https://likec4.dev";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 SERVERS";
        disabled = true;
      };
      playground = {
        command = "pnpm --filter playground dev";
        description = "🕹 Playground | 5173 | https://playground.likec4.dev";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 SERVERS";
        disabled = true;
      };
      generate = {
        command = "pnpm generate";
        description = "🏗 Pre-generate sources";
        is_tty = true;
        namespace = "📦 BUILD";
        disabled = true;
      };
      vitest-ui = {
        command = "pnpm vitest:ui";
        description = "🧪 Vitest UI";
        is_tty = true;
        namespace = "⚗ TESTS";
        disabled = true;
      };
      typecheck = {
        command = "pnpm typecheck";
        description = "🆎 Typecheck";
        is_tty = true;
        namespace = "⚗ TESTS";
        disabled = true;
      };
      availability = {
        restart = "on_failure";
        backoff_seconds = 2;
        max_restarts = 5;
      };
    };
  };
}
