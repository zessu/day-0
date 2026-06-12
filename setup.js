import fs from "fs";
import { $, which, chalk } from "zx"; // Import `which` from zx

// --- OS DETECTION ---
async function detectOS() {
  try {
    const { stdout: osRelease } = await $`cat /etc/os-release`;
    if (osRelease.includes("ID=arch") || osRelease.includes("ID_LIKE=arch")) {
      return "arch";
    } else if (
      osRelease.includes("ID=debian") ||
      osRelease.includes("ID=ubuntu") ||
      osRelease.includes("ID_LIKE=debian")
    ) {
      return "debian";
    } else {
      throw new Error(
        "Unsupported distribution. Only Debian and Arch are supported.",
      );
    }
  } catch (error) {
    console.error(chalk.red("❌ Could not detect operating system."));
    throw error;
  }
}

const osType = await detectOS();
const isDebian = osType === "debian";
const isArch = osType === "arch";

console.log(chalk.green(`🚀 Detected OS: ${osType}`));

// --- PACKAGE MANAGER ABSTRACTION ---
/**
 * Returns command and args for installing packages based on OS.
 * @param {string[]} packages - Array of package names
 * @returns {{ cmd: string, args: string[] }}
 */
function getPackageManagerCommand(packages) {
  if (isDebian) {
    return {
      cmd: "sudo",
      args: ["apt", "install", "-y", ...packages],
    };
  } else if (isArch) {
    return {
      cmd: "sudo",
      args: ["pacman", "-S", "--noconfirm", ...packages],
    };
  } else {
    throw new Error("Unsupported OS in package manager function.");
  }
}

// --- GLOBAL CONFIG ---
$.defaults = {
  cwd: process.env.HOME,
};

$.quiet = false;
$.verbose = true;

let defaultTerminalFile;
let userSelection;

const preferredTerminal = await question(
  "What Terminal Do You Use? supported options zsh | bash ",
);

switch (preferredTerminal) {
  case "zsh":
    defaultTerminalFile = "zshrc";
    userSelection = "zsh";
    break;
  case "bash":
    defaultTerminalFile = "bashrc";
    userSelection = "bash";
    break;
  default:
    console.error(
      chalk.red("terminal not supported yet consider adding support"),
    );
    throw new Error("terminal not supported yet consider adding support");
}

// --- START INSTALLATION ---
console.log(chalk.green("🚀 Setting up linux terminal tools"));

// Initial update for Debian
if (isDebian) {
  await $`sudo apt-get update`;
} else if (isArch) {
  await $`sudo pacman -Syu`;
} else {
  throw new Error("distribution not supported");
}

// --- BUILD ESSENTIALS ---
const buildEssentials = await which("gcc", { nothrow: true });
if (!buildEssentials) {
  try {
    console.log(chalk.blue("🔧 Installing build essentials"));
    const pkgs = isDebian ? ["build-essential"] : ["base-devel"];
    const { cmd, args } = getPackageManagerCommand(pkgs);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ gcc, clang installed."));
  } catch (error) {
    console.error(chalk.red("❌ Could not install build essentials"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  build essentials already installed"));
}

//  install ohmyzsh, zsh-autocomplete, zsh-autosuggestions, fast-syntax-highlighting
if (preferredTerminal === "zsh") {
  const zshPath = await which("zsh", { nothrow: true });
  if (!zshPath) {
    try {
      console.log(chalk.blue("🦄 Installing oh-my-zsh"));

      const zshPkgs = ["zsh", "zsh-autosuggestions"];
      const { cmd, args } = getPackageManagerCommand(zshPkgs);
      await $`${cmd} ${args}`;

      await $`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"`;
      await $`sudo chsh -s $(which zsh) $USER`;
      await $`echo 'alias reload="source ~/.zshrc"' >> ~/.zshrc`;

      const zshCustom =
        process.env.ZSH_CUSTOM || `${process.env.HOME}/.oh-my-zsh/custom`;
      await $`mkdir -p '${zshCustom}/plugins'`;

      await $`git clone https://github.com/zsh-users/zsh-autosuggestions.git '${zshCustom}/plugins/zsh-autosuggestions'`;
      await $`git clone --depth 1 -- https://github.com/marlonrichert/zsh-autocomplete.git '${zshCustom}/plugins/zsh-autocomplete'`;
      await $`git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git '${zshCustom}/plugins/fast-syntax-highlighting'`;

      console.log(
        chalk.green("✅ Oh My Zsh installed. zsh is now default shell."),
      );
    } catch (error) {
      console.error(chalk.red("❌ Could not install Oh My Zsh"));
      throw error;
    }
  } else {
    console.log(chalk.yellow("⚠️  oh my zsh already installed"));
  }
}

// install oh-my-bash and ble.sh
if (preferredTerminal === "bash") {
  // install oh-my-bash
  if (!$`ls ~/.bashrc`) {
    await $`bash - c "$(curl -fsSL https://raw.githubusercontent.com/ohmybash/oh-my-bash/master/tools/install.sh)"`;
  }
  const blePath = await which("ble-update", { nothrow: true });
  // install ble.sh has zsh-autosuggestions
  if (!blePath) {
    await $`yay -S blesh-git`;
  }
}

// --- NODE.JS ---
const nodePath = await which("node", { nothrow: true });
if (!nodePath) {
  try {
    console.log(chalk.blue("🟢 Installing Node.js"));
    const nodePkgs = isDebian ? ["nodejs"] : ["nodejs", "npm"];
    const { cmd, args } = getPackageManagerCommand(nodePkgs);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ NodeJS installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install NodeJS"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Node.js is already installed"));
}

// --- GO ---
const goPath = await which("go", { nothrow: true });
if (!goPath) {
  try {
    console.log(chalk.blue("🐹 Installing Go lang"));
    await $`wget https://dl.google.com/go/go1.25.1.linux-amd64.tar.gz`;
    await $`sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.25.1.linux-amd64.tar.gz`;
    await $`rm -rf go1.25.1.linux-amd64.tar.gz`;
    await $`echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.${defaultTerminalFile}`;
    console.log(chalk.green("✅ Go installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install Go"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Go is already installed"));
}

// --- ZIG ---
const zigPath = await which("zig", { nothrow: true });
if (!zigPath) {
  try {
    console.log(chalk.blue("⚡ Installing Zig"));
    await $`wget -O zig.tar.xz https://ziglang.org/builds/zig-x86_64-linux-0.16.0-dev.233+a0ec4e270.tar.xz`;
    await $`tar -xJvf zig.tar.xz`;
    await $`mv zig-x86_64-linux-0.16.0-dev.233+a0ec4e270 zig`;
    await $`sudo mv zig /usr/local/zig`;
    await $`sudo rm -rf zig.tar.xz`;
    await $`echo 'export PATH=/usr/local/zig:$PATH' >> ~/.${defaultTerminalFile}`;
    console.log(chalk.green("✅ Zig installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install Zig"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Zig is already installed"));
}

// --- RUST ---
const rustPath = await which("cargo", { nothrow: true });
if (!rustPath) {
  try {
    console.log(chalk.blue("🦀 Installing Rust"));
    await $`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`;
    console.log(chalk.green("✅ Rust installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install Rust"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Rust is already installed"));
}

// --- LAZYGIT ---
const lazyGitPath = await which("lazygit", { nothrow: true });
if (!lazyGitPath) {
  try {
    console.log(chalk.blue("🐙 Installing Lazygit"));
    const { cmd, args } = getPackageManagerCommand(["lazygit"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ Lazygit installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Lazygit"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Lazygit already installed"));
}

// --- DOCKER ---
const dockerPath = await which("docker", { nothrow: true });
if (!dockerPath) {
  try {
    console.log(chalk.blue("🐳 Installing Docker"));

    if (isDebian) {
      // Debian-specific setup
      await $`sudo apt-get update`;
      const prereqPkgs = ["ca-certificates", "curl"];
      const { cmd, args } = getPackageManagerCommand(prereqPkgs);
      await $`${cmd} ${args}`;

      await $`sudo install -m 0755 -d /etc/apt/keyrings`;
      await $`sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc`;
      await $`sudo chmod a+r /etc/apt/keyrings/docker.asc`;

      const { stdout: arch } = await $`dpkg --print-architecture`;
      const { stdout: codename } = await $`lsb_release -cs`;
      if (isDebian) {
        const repoLine = `deb [arch=${arch.trim()} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable`;
      } else {
        throw new Error("set appropriate repoLine for arch");
      }
      await $`echo ${repoLine} | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`;
      await $`sudo apt-get update`;

      const dockerPkgs = [
        "docker-ce",
        "docker-ce-cli",
        "containerd.io",
        "docker-buildx-plugin",
        "docker-compose-plugin",
      ];
      const installCmd = getPackageManagerCommand(dockerPkgs);
      await $`${installCmd.cmd} ${installCmd.args}`;
    } else if (isArch) {
      // Arch: Docker is in community repo
      await $`sudo pacman -Syu --noconfirm docker docker-compose`;
      await $`sudo systemctl enable docker.service`;
      await $`sudo systemctl start docker.service`;
    }

    console.log(chalk.green("✅ Docker installed"));
  } catch (error) {
    console.log(
      chalk.red("❌ Error installing Docker:"),
      error.stderr || error.message,
    );
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Docker already installed"));
}

// --- LAZYDOCKER ---
const lazyDockerPath = await which("lazydocker", { nothrow: true });
if (!lazyDockerPath) {
  try {
    console.log(chalk.blue("🐋 Installing Lazydocker"));
    await $`curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash`;
    console.log(chalk.green("✅ Lazydocker installed"));
  } catch (error) {
    console.log(chalk.red("❌ Error installing Lazydocker"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Lazydocker already installed"));
}

// --- NEOVIM ---
const nvimPath = await which("nvim", { nothrow: true });
if (!nvimPath) {
  try {
    console.log(chalk.blue("📝 Installing Neovim"));

    if (isDebian || isArch) {
      const { cmd, args } = getPackageManagerCommand(["neovim"]);
      await $`${cmd} ${args}`;
    } else {
      // Fallback: download binary
      await $`wget -O nvim-linux-x86_64.tar.gz https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz`;
      await $`sudo rm -rf /opt/nvim`;
      await $`sudo tar -C /opt -xzf nvim-linux-x86_64.tar.gz`;
      await $`echo 'export PATH="/opt/nvim-linux-x86_64/bin:$PATH"' >> ~/.${defaultTerminalFile}`;
      await $`rm -rf nvim-linux-x86_64.tar.gz`;
    }

    console.log(chalk.green("✅ Neovim installed"));
  } catch (error) {
    console.log(chalk.red("❌ Error installing Neovim"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Neovim already installed"));
}

// --- POWERLEVEL10K ---
if (preferredTerminal === "zsh") {
  const zshCustomDir =
    process.env.ZSH_CUSTOM || `${process.env.HOME}/.oh-my-zsh/custom`;
  const powerlevel10kPath = `${zshCustomDir}/themes/powerlevel10k`;

  if (!fs.existsSync(powerlevel10kPath)) {
    console.log(chalk.blue("🎨 Installing Powerlevel10k theme..."));
    await $`git clone --depth=1 https://github.com/romkatv/powerlevel10k.git '${powerlevel10kPath}'`;
    await $`echo 'ZSH_THEME="powerlevel10k/powerlevel10k"' >> ~/.zshrc`;
    console.log(chalk.green("✅ Powerlevel10k installed"));
  } else {
    console.log(chalk.yellow("⚠️  Powerlevel10k already installed"));
  }
}

// --- RIPGREP ---
const rgPath = await which("rg", { nothrow: true });
if (!rgPath) {
  try {
    console.log(chalk.blue("🔍 Installing ripgrep"));
    const { cmd, args } = getPackageManagerCommand(["ripgrep"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ ripgrep installed"));
  } catch (error) {
    console.log(chalk.red("❌ Error installing ripgrep"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  rg already installed"));
}

// --- TLDR ---
const tldrPath = await which("tldr", { nothrow: true });
if (!tldrPath) {
  try {
    console.log(chalk.blue("📚 Installing tldr pages"));
    await $`bun add -g tldr`;
    console.log(chalk.green("✅ tldr pages installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing tldr pages"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  tldr-pages already installed"));
}

// --- NVM ---
console.log(chalk.blue("📦 Installing nvm (Node Version Manager)"));
await $`PROFILE=~/.${defaultTerminalFile} && wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`;
console.log(chalk.green("✅ Node Version Manager installed"));

// --- GEMINI CLI ---
const geminiPath = await which("gemini", { nothrow: true });
if (!geminiPath) {
  try {
    console.log(chalk.blue("🤖 Installing Gemini CLI"));
    await $`bun add -g @google/gemini-cli`;
    console.log(chalk.green("✅ Gemini CLI installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Gemini CLI"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Gemini CLI already installed"));
}

// --- FD ---
const fdPath = await which("fd", { nothrow: true });
if (!fdPath) {
  try {
    console.log(chalk.blue("📁 Installing fd"));
    if (isDebian) {
      await $`sudo apt install -y fd-find`;
      await $`ln -sf $(which fdfind) ~/.local/bin/fd`;
    } else if (isArch) {
      await $`sudo pacman -S --noconfirm fd`;
    }
    console.log(chalk.green("✅ fd installed"));
  } catch (error) {
    console.error(
      chalk.red(
        "❌ Error installing fd — view docs: https://github.com/sharkdp/fd",
      ),
    );
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  fd already installed"));
}

// --- FZF ---
const fzfPath = await which("fzf", { nothrow: true });
if (fzfPath) {
  try {
    console.log(chalk.blue("🔎 Installing fzf"));
    const { cmd, args } = getPackageManagerCommand(["fzf"]);
    await $`${cmd} ${args}`;
    //TODO: the next command changes depending on whether we use bash/zsh/fish
    // change this, doc link https://github.com/junegunn/fzf
    await $`echo 'source <(fzf --zsh)' >> ~/.${defaultTerminalFile}`;
    await $`echo 'export FZF_DEFAULT_COMMAND="fd --hidden --follow --exclude .git --color=always"' >> ~/.${defaultTerminalFile}`;
    const fzfOptions = `export FZF_DEFAULT_OPTS="--ansi --style full --preview 'bat --color=always {}' --preview-window '~3' --bind 'focus:transform-header:file --brief {}'"\n`;
    fs.appendFileSync(
      process.env.HOME + `/.${defaultTerminalFile}`,
      fzfOptions,
    );
    console.log(chalk.green("✅ fzf installed"));
  } catch (error) {
    console.error(
      chalk.red(
        "❌ Error installing fzf — view docs: https://github.com/junegunn/fzf#installation",
      ),
    );
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  fzf already installed"));
}

// --- BAT ---
const batPath = await which("bat", { nothrow: true });
if (!batPath) {
  try {
    console.log(chalk.blue("📓 Installing bat"));
    if (isDebian) {
      await $`sudo apt install -y bat`;
      await $`ln -sf /usr/bin/batcat ~/.local/bin/bat`;
    } else if (isArch) {
      await $`sudo pacman -S --noconfirm bat`;
    }
    console.log(chalk.green("✅ bat installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing bat"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  bat already installed"));
}

// --- UV ---
const uvPath = await which("uv", { nothrow: true });
if (!uvPath) {
  try {
    console.log(chalk.blue("⚡ Installing uv"));
    await $`curl -LsSf https://astral.sh/uv/install.sh | sh`;
    console.log(chalk.green("✅ uv installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing uv"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  uv already installed"));
}

// --- POSTING ---
const postingPath = await which("posting", { nothrow: true });
if (!postingPath) {
  try {
    console.log(chalk.blue("📩 Installing Posting"));
    await $`uv tool install --python 3.13 posting`;
    console.log(chalk.green("✅ Posting installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Posting"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Posting already installed"));
}

// --- OHA ---
const ohaPath = await which("oha", { nothrow: true });
if (!ohaPath) {
  try {
    console.log(chalk.blue("📈 Installing oha"));
    await $`cargo install oha`;
    console.log(chalk.green("✅ oha installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing oha"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  oha already installed"));
}

// --- HARLEQUIN ---
const harlequinPath = await which("harlequin", { nothrow: true });
if (!harlequinPath) {
  try {
    console.log(chalk.blue("📊 Installing Harlequin"));
    await $`uv tool install harlequin`;
    await $`uv tool install 'harlequin[postgres,mysql]'`;
    console.log(chalk.green("✅ Harlequin installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Harlequin"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Harlequin already installed"));
}

// --- BTOP ---
const btopPath = await which("btop", { nothrow: true });
if (!btopPath) {
  try {
    console.log(chalk.blue("📊 Installing btop"));
    const { cmd, args } = getPackageManagerCommand(["btop"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ btop installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing btop"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  btop already installed"));
}

// --- ZOXIDE ---
const zoxidePath = await which("zoxide", { nothrow: true });
if (!zoxidePath) {
  try {
    console.log(chalk.blue("🌀 Installing zoxide"));
    await $`curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh`;
    await $`echo 'eval "$(zoxide init ${userSelection})"' >> ~/.${defaultTerminalFile}`;
    console.log(chalk.green("✅ zoxide installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing zoxide"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  zoxide already installed"));
}

// --- JQ ---
const jqPath = await which("jq", { nothrow: true });
if (!jqPath) {
  try {
    console.log(chalk.blue("🧩 Installing jq"));
    const { cmd, args } = getPackageManagerCommand(["jq"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ jq installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing jq"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  jq already installed"));
}

// --- FFMPEG ---
const ffmpegPath = await which("ffmpeg", { nothrow: true });
if (!ffmpegPath) {
  try {
    console.log(chalk.blue("🎬 Installing ffmpeg"));
    const { cmd, args } = getPackageManagerCommand(["ffmpeg"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ ffmpeg installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing ffmpeg"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  ffmpeg already installed"));
}

// --- IMAGEMAGICK ---
const magickPath = await which("magick", { nothrow: true });
if (!magickPath) {
  try {
    console.log(chalk.blue("🖼️  Installing ImageMagick"));
    const pkgs = isDebian
      ? ["imagemagick", "7zip", "poppler-utils", "fd-find"]
      : ["imagemagick", "p7zip", "poppler", "fd"];
    const { cmd, args } = getPackageManagerCommand(pkgs);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ ImageMagick installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing ImageMagick"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  ImageMagick already installed"));
}

// --- YAZI ---
const yaziPath = await which("yazi", { nothrow: true });
if (!yaziPath) {
  try {
    console.log(chalk.blue("📁 Installing Yazi"));
    // Ensure rust is installed first
    await $`cargo install --force yazi-build`;
    const { cmd, args } = getPackageManagerCommand(["resvg"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ Yazi installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Yazi"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Yazi already installed"));
}

// --- EZA ---
const ezaPath = await which("eza", { nothrow: true });
if (!ezaPath) {
  try {
    console.log(chalk.blue("📋 Installing eza"));
    const { cmd, args } = getPackageManagerCommand(["eza"]);
    await $`${cmd} ${args}`;
    await $`echo 'alias ls="eza -1la"' >> ~/.${defaultTerminalFile}`;
    console.log(chalk.green("✅ eza installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing eza"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  eza already installed"));
}

// --- Hyperfine ---
const hyperfinePath = await which("hyperfine", { nothrow: true });
if (!hyperfinePath) {
  try {
    console.log(chalk.blue("⚡ Installing hyperfine"));
    const { cmd, args } = getPackageManagerCommand(["hyperfine"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ hyperfine installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing hyperfine"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  hyperfine already installed"));
}

const dyskPath = await which("dysk", { nothrow: true });
if (!dyskPath) {
  try {
    console.log(chalk.blue("⚡Installing dysk"));
    await $`cargo install --locked dysk`;
    console.log(chalk.yellow("dysk installed"));
  } catch (error) {}
} else {
  console.log("⚠️ dysk has already been installed;");
}

// --- XH ---
const xhPath = await which("xh", { nothrow: true });
if (!xhPath) {
  try {
    console.log(chalk.blue("🌐 Installing xh"));
    await $`curl -sfL https://raw.githubusercontent.com/ducaale/xh/master/install.sh | sh`;
    console.log(chalk.green("✅ xh installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing xh"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  xh already installed"));
}

// --- YT-DLP ---
const ytDlpPath = await which("yt-dlp", { nothrow: true });
if (!ytDlpPath) {
  try {
    console.log(chalk.blue("📺 Installing yt-dlp"));
    const { cmd, args } = getPackageManagerCommand(["yt-dlp"]);
    await $`${cmd} ${args}`;
    console.log(chalk.green("✅ yt-dlp installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing yt-dlp"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  yt-dlp already installed"));
}

// --- ATUIN ---
const atuinPath = await which("atuin", { nothrow: true });
if (!atuinPath) {
  try {
    console.log(chalk.blue("📜 Installing atuin"));
    await $`curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh -s -- --non-interactive`;
    console.log(chalk.green("✅ atuin installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing atuin"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  atuin already installed"));
}

// --- YOUTUBE DOWNLOAD FUNCTIONS ---
console.log(chalk.blue("📺 Adding YouTube download functions"));

const youtubeFunctions = `
# ============================================================================
# YouTube Download Functions
# ============================================================================

downloadplaylist() {
  # Check if yt-dlp is installed
  if ! command -v yt-dlp &>/dev/null; then
    echo "Error: 'yt-dlp' is not installed or not in your PATH." >&2
    echo "Please install yt-dlp to use this function." >&2
    return 1
  fi

  # Check for a provided URL argument
  if [ -z "$1" ]; then
    echo "Usage: downloadplaylist \\"<PLAYLIST_URL>\\""
    echo "  e.g., downloadplaylist \\"https://www.youtube.com/playlist?list=...\\""
    return 1
  fi

  local playlist_url="$1"
  local output_template="%(playlist_index)s - %(title)s.%(ext)s"

  echo "Starting download for playlist: $playlist_url"
  echo "Files will be saved as: $output_template"

  # Run yt-dlp with the specified output format
  # The -o option sets the output template.
  # The --yes-playlist flag is generally good practice to explicitly confirm it's a playlist.
  yt-dlp -i --download-archive downloaded.txt -o "$output_template" --yes-playlist "$playlist_url"

  local exit_status=$?

  if [ $exit_status -eq 0 ]; then
    echo "✅ Playlist download finished successfully."
  else
    echo "❌ Playlist download failed with exit code $exit_status." >&2
  fi

  return $exit_status
}

download720video() {
  # Check if yt-dlp is installed
  if ! command -v yt-dlp &>/dev/null; then
    echo "Error: 'yt-dlp' is not installed or not in your PATH." >&2
    echo "Please install yt-dlp to use this function." >&2
    return 1
  fi

  # Check for a provided URL argument
  if [ -z "$1" ]; then
    echo "Usage: download720video \\"<VIDEO_URL>\\""
    echo "  e.g., download720video \\"https://youtu.be/W4EwfEU8CGA\\""
    return 1
  fi

  local video_url="$1"
  local output_template="%(title)s.%(ext)s"

  echo "Starting download for video: $video_url"
  echo "Quality: 720p (or best available up to 720p)"

  # Run yt-dlp with format selection for 720p
  yt-dlp -f "best[height<=720]" -o "$output_template" "$video_url"

  local exit_status=$?

  if [ $exit_status -eq 0 ]; then
    echo "✅ Video download finished successfully."
  else
    echo "❌ Video download failed with exit code $exit_status." >&2
  fi

  return $exit_status
}
`;

fs.appendFileSync(process.env.HOME + `/.${defaultTerminalFile}`, youtubeFunctions);
console.log(chalk.green("✅ YouTube download functions added"));

// --- FINAL MESSAGE ---
console.log(chalk.green("🎉 Everything has been installed successfully"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
console.log(chalk.cyanBright("✨ PLEASE CLOSE AND REOPEN YOUR TERMINAL!"));
console.log(chalk.blue("Then run:"));
console.log(chalk.blue(`1️⃣  source ~/.${defaultTerminalFile}`));
if (isDebian) {
  console.log(chalk.blue("2️⃣  sudo apt update && sudo apt upgrade"));
} else if (isArch) {
  console.log(chalk.blue("2️⃣  sudo pacman -Syu"));
}
if (preferredTerminal === "zsh") {
  console.log(
    chalk.blue(
      "3️⃣  Add to ~/.zshrc: plugins=(git zsh-autosuggestions fast-syntax-highlighting zsh-autocomplete)",
    ),
  );
}
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
