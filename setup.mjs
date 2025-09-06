#!/usr/bin/env zx

$.cwd = process.env.HOME // Use home directory for downloads

await $`sudo apt-get update`

// Install Oh My Zsh and set as default shell
const zshPathOrNull = await which("zsh", { nothrow: true })
if(!zshPathOrNull) {
try {
  await $`sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended`
  await $`sudo chsh -s $(which zsh) $USER`
  console.log("✅ Oh My Zsh installed. zsh is now default shell.")
} catch (error) {
  console.log("Could not install Oh My Zsh")
  throw error
}
} else {
  console.log("oh my zsh already installed")
}

// Install Node
const nodePathOrNull = await which("node", { nothrow: true })
if (!nodePathOrNull) {
  try {
    await $`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`
    console.log("Node installed")
  } catch (error) {
    console.log("Could not install Node")
    throw error
  }
} else {
  console.log("Node is already installed")
}

// Install Bun
const bunPathOrNull = await which("bun", { nothrow: true })
if (!bunPathOrNull) {
  try {
    await $`curl -fsSL https://bun.sh/install | bash`
    console.log("Bun installed")
  } catch (error) {
    console.log("Could not install Bun")
    throw error
  }
} else {
  console.log("Bun is already installed")
}

// Install Go
const goPathOrNull = await which("go", { nothrow: true })
if (!goPathOrNull) {
  try {
    await $`wget https://dl.google.com/go/go1.25.1.linux-amd64.tar.gz`
    await $`sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.25.1.linux-amd64.tar.gz`
    await $`rm go1.25.1.linux-amd64.tar.gz` // Clean up
    await $`echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.zshrc` // Persist PATH
    console.log("Go installed")
  } catch (error) {
    console.log(error)
    console.log("Could not install Go")
    throw error
  }
} else {
  console.log("Go is already installed")
}

// install lazygit
const lazyGitPath = await which("lazygit", { nothrow: true});
if(!lazyGitPath) {
  try {
    await $`sudo apt install lazygit`
  } catch (error) {
    console.log("error installing lazygit")
    throw error;    
  }
} else{
  console.log("lazygit already installed")
}

// Install Docker
const dockerPath = await which("docker", { nothrow: true })
if (!dockerPath) {
  try {
    // Install prerequisites
    await $`sudo apt-get update`
    await $`sudo apt-get install -y ca-certificates curl`

    // Add Docker's GPG key
    await $`sudo install -m 0755 -d /etc/apt/keyrings`
    await $`sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc`
    await $`sudo chmod a+r /etc/apt/keyrings/docker.asc`

    // Add Docker's APT repository
    const { stdout: arch } = await $`dpkg --print-architecture`
    const codename = "bookworm"
    const repoLine = `deb [arch=${arch.trim()} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian ${codename} stable`
    await $`echo ${repoLine} | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`
    await $`sudo apt-get update`

    // Update package index and install Docker
    await $`sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin`
    console.log("Docker installed")
  } catch (error) {
    console.log("Error installing Docker:", error.stderr || error)
    throw error
  }
} else {
  console.log("Docker already installed")
}

// install lazydocker
const lazyDockerPath = await which("lazydocker", { nothrow: true});
if(!lazyDockerPath) {
  try {
    await $`curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_linux.sh | bash`
  } catch (error) {
    console.log("error installing lazydocker")
    throw error;    
  }
} else {
  console.log("lazydocker already installed")
}
