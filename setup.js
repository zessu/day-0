import fs from "fs";
const { chalk } = require("zx");

// TODO: add links to github packages/documentation on error failed to download

$.defaults = {
  cwd: process.env.HOME, // downloads dir
  verbose: true,
};

console.log(chalk.green("🚀 Setting up linux terminal tools"));
await $`sudo apt-get update`;

// Install Oh My Zsh and set as default shell
const buildEssentials = await which("gcc", { nothrow: true });
if (!buildEssentials) {
  try {
    console.log(chalk.blue("🔧 Installing build-essentials"));
    await $`sudo apt install -y build-essential`;
    console.log(chalk.green("✅ gcc, clang installed."));
  } catch (error) {
    console.error(chalk.red("❌ Could not install build essentials"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  build essentials already installed"));
}

// Install Oh My Zsh and set as default shell
const zshPath = await which("zsh", { nothrow: true }); // Fixed typo: was "zssh"
if (!zshPath) {
  try {
    console.log(chalk.blue("🦄 Installing oh-my-zsh")); // Fixed typo: was "oh-my-zish"
    await $`sudo apt install zsh-autosuggestions zsh-syntax-highlighting zsh`;
    await $`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended`;
    await $`sudo chsh -s $(which zsh) $USER`;
    await $`echo alias reload="source ~/.zshrc" >> ~/.zshrc`;
    await $`git clone https://github.com/zsh-users/zsh-autosuggestions.git $ZSH_CUSTOM/plugins/zsh-autosuggestions`;
    await $`git clone https://github.com/zsh-users/zsh-syntax-highlighting.git $ZSH_CUSTOM/plugins/zsh-syntax-highlighting`;
    const zshCustom = `${
      process.env.ZSH_CUSTOM || `${process.env.HOME}/.oh-my-zsh/custom`
    }`;
    await $`git clone https://github.com/zdharma-continuum/fast-syntax-highlighting.git '${zshCustom}/plugins/fast-syntax-highlighting'`;
    await $`git clone --depth 1 -- https://github.com/marlonrichert/zsh-autocomplete.git $ZSH_CUSTOM/plugins/zsh-autocomplete`;
    console.log(
      chalk.green("✅ Oh My Zsh installed. zsh is now default shell.")
    );
  } catch (error) {
    console.error(chalk.red("❌ Could not install Oh My Zsh"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  oh my zsh already installed"));
}

// Install Node
const nodePath = await which("node", { nothrow: true });
if (!nodePath) {
  try {
    console.log(chalk.blue("🟢 Installing Node.js"));
    await $`sudo apt install -y nodejs`;
    console.log(chalk.green("✅ NodeJS installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install NodeJS"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Node-Js is already installed"));
}

// Install Go
const goPath = await which("go", { nothrow: true });
if (!goPath) {
  try {
    console.log(chalk.blue("🐹 Installing Go lang"));
    await $`wget https://dl.google.com/go/go1.25.1.linux-amd64.tar.gz`;
    await $`sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.25.1.linux-amd64.tar.gz`;
    await $`rm go1.25.1.linux-amd64.tar.gz`; // Clean up
    await $`echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.zshrc`; // Persist PATH
    console.log(chalk.green("✅ Go installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install Go"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Go is already installed"));
}

// Install zig
const zigPath = await which("zig", { nothrow: true });
if (!zigPath) {
  try {
    console.log(chalk.blue("⚡ Installing Zig"));
    await $`wget -O zig.tar.xz https://ziglang.org/builds/zig-x86_64-linux-0.16.0-dev.233+a0ec4e270.tar.xz`;
    await $`tar -xJvf zig.tar.xz`;
    await $`mv zig-x86_64-linux-0.16.0-dev.233+a0ec4e270 zig`;
    await $`sudo mv zig /usr/local/zig`;
    await $`sudo rm -rf zig.tar.xz`; // clean up
    await $`echo 'export PATH=/usr/local/zig:$PATH' >> ~/.zshrc`;
    console.log(chalk.green("✅ Zig installed"));
  } catch (error) {
    console.error(chalk.red("❌ Could not install Zig"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Zig is already installed"));
}

// install rust
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

// install lazygit
const lazyGitPath = await which("lazygit", { nothrow: true });
if (!lazyGitPath) {
  try {
    console.log(chalk.blue("🐙 Installing Lazygit"));
    await $`sudo apt install lazygit`;
    console.log(chalk.green("✅ Lazygit installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Lazygit"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Lazygit already installed"));
}

// Install Docker
const dockerPath = await which("docker", { nothrow: true });
if (!dockerPath) {
  try {
    console.log(chalk.blue("🐳 Installing Docker"));
    // Install prerequisites
    await $`sudo apt-get update`;
    await $`sudo apt-get install -y ca-certificates curl`;

    // Add Docker's GPG key
    await $`sudo install -m 0755 -d /etc/apt/keyrings`;
    await $`sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc`;
    await $`sudo chmod a+r /etc/apt/keyrings/docker.asc`;

    // Add Docker's APT repository
    const { stdout: arch } = await $`dpkg --print-architecture`;
    const codename = "bookworm";
    const repoLine = `deb [arch=${arch.trim()} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian ${codename} stable`;
    await $`echo ${repoLine} | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`;
    await $`sudo apt-get update`;

    // Update package index and install Docker
    await $`sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`;
    console.log(chalk.green("✅ Docker installed"));
  } catch (error) {
    console.log(
      chalk.red("❌ Error installing Docker:"),
      error.stderr || error
    );
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Docker already installed"));
}

// install lazydocker
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

// install neovim
const nvimPath = await which("nvim", { nothrow: true });
if (!nvimPath) {
  try {
    console.log(chalk.blue("📝 Installing Neovim"));
    await $`wget -O nvim-linux-x86_64.tar.gz https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz`;
    await $`sudo rm -rf /opt/nvim`;
    await $`sudo tar -C /opt -xzf nvim-linux-x86_64.tar.gz`;
    await $`echo 'export PATH="/opt/nvim-linux-x86_64/bin:$PATH"' >> ~/.zshrc`;
    await $`sudo rm -rf nvim-linux-x86_64.tar.gz`; // Fixed typo: was .tar.g
    console.log(chalk.green("✅ Neovim installed"));
  } catch (error) {
    console.log(chalk.red("❌ Error installing Neovim"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Neovim already installed"));
}

// Install Powerlevel10k theme (includes Nerd Fonts support)
const zshCustom =
  process.env.ZSH_CUSTOM || `${process.env.HOME}/.oh-my-zsh/custom`;
const powerlevel10kFolder = await $`ls "${zshCustom}/themes/powerlevel10k"`; // see if folder already exists before cloning
if (powerlevel10kFolder.exitCode > 0) {
  console.log(chalk.blue("🎨 Installing Powerlevel10k theme..."));
  await $`git clone --depth=1 https://github.com/romkatv/powerlevel10k.git "${zshCustom}/themes/powerlevel10k" --verbose`;
  await $`echo 'export ZSH_THEME="powerlevel10k/powerlevel10k"' >> ~/.zshrc`; // Fixed: was export without echo
  console.log(chalk.green("✅ Powerlevel10k installed"));
} else {
  console.log(chalk.yellow("⚠️  Powerlevel10k already installed"));
}

// install ripgrep (needed by Telescope e.t.c)
const rgPath = await which("rg", { nothrow: true });
if (!rgPath) {
  try {
    console.log(chalk.blue("🔍 Installing ripgrep")); // Fixed typo: was "rigrep"
    await $`sudo apt-get install ripgrep`;
    console.log(chalk.green("✅ ripgrep installed")); // Fixed: was console.error
  } catch (error) {
    console.log(chalk.red("❌ Error installing ripgrep"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  rg already installed"));
}

// install nvchad
const nvchadConfigPath = `${process.env.HOME}/.config/nvim`; // Check config folder instead of binary
if (!fs.existsSync(nvchadConfigPath)) {
  try {
    console.log(chalk.blue("⚡ Installing NvChad"));
    await $`rm -rf ~/.config/nvim`;
    await $`rm -rf ~/.local/state/nvim`;
    await $`rm -rf ~/.local/share/nvim`;
    await $`git clone https://github.com/NvChad/starter ~/.config/nvim && nvim`;
    console.log(chalk.green("✅ NvChad installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing NvChad"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  NvChad already installed"));
}

// add tldr pages
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

// install nvm
console.log(chalk.blue("📦 Installing nvm (Node Version Manager)"));
await $`PROFILE=~/.zshrc && wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`;
console.log(chalk.green("✅ Node Version Manager installed"));

// add gemini-cli
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

// install fd
const fdPath = await which("fd", { nothrow: true });
if (!fdPath) {
  try {
    console.log(chalk.blue("📁 Installing fd"));
    await $`sudo apt install fd-find`;
    await $`ln -s $(which fdfind) ~/.local/bin/fd`;
    console.log(chalk.green("✅ fd installed"));
  } catch (error) {
    console.error(
      chalk.red(
        "❌ Error installing fd — view docs: https://github.com/sharkdp/fd"
      )
    );
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  fd already installed"));
}

// install fzf
const fzfPath = await which("fzf", { nothrow: true });
if (!fzfPath) {
  try {
    console.log(chalk.blue("🔎 Installing fzf"));
    await $`sudo apt install fzf`;
    await $`echo 'source <(fzf --zsh)' >> ~/.zshrc`;
    await $`echo 'export FZF_DEFAULT_COMMAND="fd --type f --color=always"' >> ~/.zshrc`;
    const fzfOptions = `export FZF_DEFAULT_OPTS="--style full --preview 'bat --color=always {}' --preview-window '~3' --bind 'focus:transform-header:file --brief {}'"\n`;
    fs.appendFileSync(process.env.HOME + "/.zshrc", fzfOptions);
    console.log(chalk.green("✅ fzf installed"));
  } catch (error) {
    console.error(
      chalk.red(
        "❌ Error installing fzf — view docs: https://github.com/junegunn/fzf#installation"
      )
    );
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  fzf already installed"));
}

// install bat
const batPath = await which("bat", { nothrow: true });
if (!batPath) {
  try {
    console.log(chalk.blue("📓 Installing bat"));
    await $`sudo apt install bat -y`;
    await $`ln -s /usr/bin/batcat ~/.local/bin/bat`;
    console.log(chalk.green("✅ bat installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing bat"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  bat already installed"));
}

// install uv
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

// install posting
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

// install oha
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

// install harlequin
const harlequinPath = await which("harlequin", { nothrow: true });
if (!harlequinPath) {
  try {
    console.log(chalk.blue("📊 Installing Harlequin"));
    await $`uv tool install harlequin`;
    console.log(chalk.green("✅ Harlequin installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Harlequin"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Harlequin already installed"));
}

// install btop
const btopPath = await which("btop", { nothrow: true });
if (!btopPath) {
  try {
    console.log(chalk.blue("📊 Installing btop"));
    await $`sudo apt install btop`;
    console.log(chalk.green("✅ btop installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing btop"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  btop already installed"));
}

// install zoxide
const zoxidePath = await which("zoxide", { nothrow: true }); // Fixed typo: was "zoxiedPath"
if (!zoxidePath) {
  try {
    console.log(chalk.blue("🌀 Installing zoxide"));
    await $`curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh`;
    await $`echo 'eval "$(zoxide init zsh)"' >> ~/.zshrc`;
    console.log(chalk.green("✅ zoxide installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing zoxide"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  zoxide already installed"));
}

// install jq
const jqPath = await which("jq", { nothrow: true });
if (!jqPath) {
  try {
    console.log(chalk.blue("🧩 Installing jq"));
    await $`sudo apt install jq -y`;
    console.log(chalk.green("✅ jq installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing jq"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  jq already installed"));
}

// install ffmpeg
const ffmpegPath = await which("ffmpeg", { nothrow: true });
if (!ffmpegPath) {
  try {
    console.log(chalk.blue("🎬 Installing ffmpeg"));
    await $`sudo apt install ffmpeg -y`;
    console.log(chalk.green("✅ ffmpeg installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing ffmpeg"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  ffmpeg already installed"));
}

// install imagemagick
const magickPath = await which("magick", { nothrow: true });
if (!magickPath) {
  try {
    console.log(chalk.blue("🖼️  Installing ImageMagick"));
    await $`sudo apt install 7zip poppler-utils fd-find imagemagick -y`;
    console.log(chalk.green("✅ ImageMagick installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing ImageMagick"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  ImageMagick already installed"));
}

// install yazi
const yaziPath = await which("yazi", { nothrow: true });
if (!yaziPath) {
  try {
    console.log(chalk.blue("📁 Installing Yazi"));
    await $`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`;
    await $`rustup update`;
    await $`cargo install --force yazi`;
    console.log(chalk.green("✅ Yazi installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing Yazi"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  Yazi already installed"));
}

// install eza
const ezaPath = await which("eza", { nothrow: true });
if (!ezaPath) {
  try {
    console.log(chalk.blue("📋 Installing eza"));
    await $`sudo apt install eza`;
    await $`echo 'alias ls="eza -1la"' >> ~/.zshrc`;
    console.log(chalk.green("✅ eza installed"));
  } catch (error) {
    console.error(chalk.red("❌ Error installing eza"));
    throw error;
  }
} else {
  console.log(chalk.yellow("⚠️  eza already installed"));
}

console.log(chalk.green("🎉 Everything has been installed successfully"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
console.log(
  chalk.cyanBright(
    "✨ Please CLOSE and REOPEN your terminal and run the following commands for all changes to take effect!"
  )
);
console.log(chalk.blue("1️⃣  source ~/.zshrc"));
console.log(
  chalk.blue(
    "2️⃣Add to ~/.zshrc: plugins=(git zsh-autosuggestions zsh-syntax-highlighting fast-syntax-highlighting zsh-autocomplete)"
  )
);
console.log(chalk.blue("3️⃣sudo apt update")); // Fixed typo: was "w."
console.log(chalk.blue("4️⃣  sudo apt upgrade"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
console.log(chalk.yellow(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"));
