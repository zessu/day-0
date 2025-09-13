const { chalk } = require("zx");

$.defaults = {
  cwd: process.env.HOME, // downloands dir
  verbose: true,
};

console.log(chalk.green("Setting up linux terminal tools"));
await $`sudo apt-get update`;

// Install Oh My Zsh and set as default shell
const buildEssentials = await which("gcc", { nothrow: true });
if (!buildEssentials) {
  try {
    console.log(chalk.blue("Installing build-essentials"));
    await $`sudo apt install -y build-essential`;
    console.log(chalk.green("✅ gcc, clang installed."));
  } catch (error) {
    console.error(chalk.red("Could not install build essentials"));
    throw error;
  }
} else {
  console.log(chalk.yellow("build essentials already installed"));
}

// Install Oh My Zsh and set as default shell
const zshPath = await which("zsh", { nothrow: true });
if (!zshPath) {
  try {
    console.log(chalk.blue("Installing oh-my-zish"));
    await $`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended`;
    await $`sudo chsh -s $(which zsh) $USER`;
    console.log(
      chalk.green("✅ Oh My Zsh installed. zsh is now default shell.")
    );
  } catch (error) {
    console.error(chalk.red("Could not install Oh My Zsh"));
    throw error;
  }
} else {
  console.log(chalk.yellow("oh my zsh already installed"));
}

// Install Go
const goPath = await which("go", { nothrow: true });
if (!goPath) {
  try {
    console.log(chalk.blue("Installing go lang"));
    await $`wget https://dl.google.com/go/go1.25.1.linux-amd64.tar.gz`;
    await $`sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.25.1.linux-amd64.tar.gz`;
    await $`rm go1.25.1.linux-amd64.tar.gz`; // Clean up
    await $`echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.zshrc`; // Persist PATH
    console.log(chalk.green("Go installed"));
  } catch (error) {
    console.error(chalk.red(error));
    console.error(chalk.red("Could not install Go"));
    throw error;
  }
} else {
  console.log(chalk.yellow("Go is already installed"));
}

// install lazygit
const lazyGitPath = await which("lazygit", { nothrow: true });
if (!lazyGitPath) {
  try {
    console.log(chalk.blue("Installing lazygit"));
    await $`sudo apt install lazygit`;
    console.log(chalk.green("lazygit installed"));
  } catch (error) {
    console.error(chalk.red("error installing lazygit"));
    throw error;
  }
} else {
  console.log(chalk.yellow("lazygit already installed"));
}

// Install Docker
const dockerPath = await which("docker", { nothrow: true });
if (!dockerPath) {
  try {
    console.log(chalk.blue("Installing Docker"));
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
    console.log(chalk.green("Docker installed"));
  } catch (error) {
    console.log(chalk.error("Error installing Docker:"), error.stderr || error);
    throw error;
  }
} else {
  console.log(chalk.yellow("Docker already installed"));
}

// install lazydocker
const lazyDockerPath = await which("lazydocker", { nothrow: true });
if (!lazyDockerPath) {
  try {
    console.log(chalk.blue("Installing lazydocker"));
    await $`curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash`;
    console.log(chalk.green("lazydocker installed"));
  } catch (error) {
    console.log(chalk.red("error installing lazydocker"));
    throw error;
  }
} else {
  console.log(chalk.yellow("lazydocker already installed"));
}

// install nvim
const nvimPath = await which("nvim", { nothrow: true });
if (!nvimPath) {
  try {
    console.log(chalk.blue("Installing nvim"));
    await $`wget -O nvim-linux-x86_64.tar.gz https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz`;
    await $`sudo rm -rf /opt/nvim`;
    await $`sudo tar -C /opt -xzf nvim-linux-x86_64.tar.gz`;
    await $`echo 'export PATH="/opt/nvim-linux-x86_64/bin:$PATH"' >> ~/.zshrc`;
    console.log(chalk.green("nvim installed"));
  } catch (error) {
    console.log(chalk.red("error installing nvim"));
    throw error;
  }
} else {
  console.log(chalk.yellow("nvim already installed"));
}

// install nvchad
const nvchadPath = await which("nvim", { nothrow: true });
if (!nvchadPath) {
  try {
    console.log(chalk.blue("Installing nvchad"));
    await $`rm -rf ~/.config/nvim`;
    await $`rm -rf ~/.local/state/nvim`;
    await $`rm -rf ~/.local/share/nvim`;
    await $`git clone https://github.com/NvChad/starter ~/.config/nvim && nvim`;
    console.log(chalk.green("nvchad installed"));
  } catch (error) {
    console.log(chalk.error("error installing nvchad"));
    throw error;
  }
} else {
  console.log(chalk.yellow("nvchad already installed"));
}
