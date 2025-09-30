# 🎲 NumberGamble

[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-e6e6e6?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)
[![FHEVM](https://img.shields.io/badge/Powered%20by-FHEVM-blueviolet)](https://github.com/zama-ai/fhevm)

**NumberGamble** is a provably fair, privacy-preserving decentralized dice game built on Ethereum using **Fully Homomorphic Encryption (FHE)** technology. Players compete by rolling encrypted dice, making strategic decisions based on their private rolls, and the highest roll wins the pot—all without revealing their numbers until the game concludes.

## 🌟 Overview

NumberGamble revolutionizes on-chain gaming by combining the transparency of blockchain with the privacy of fully homomorphic encryption. Unlike traditional blockchain games where all data is publicly visible, NumberGamble ensures that each player's dice rolls remain completely private and encrypted throughout the game, preventing any form of front-running or unfair advantage.

### Key Features

- **🔒 Privacy-First Gaming**: Dice rolls are encrypted using FHEVM (Fully Homomorphic Encryption Virtual Machine), ensuring complete privacy during gameplay
- **⚡ Provably Fair**: All randomness is verifiable on-chain using deterministic seed generation from block data
- **💰 Transparent Economy**: All game fees and pot distributions are handled by immutable smart contracts
- **🎯 Strategic Gameplay**: Players must decide whether to continue (risking more) or fold based on their private dice rolls
- **🌐 Fully Decentralized**: No central authority, no trusted third party—pure smart contract logic
- **🚀 Low Entry Barrier**: Minimal fees (0.0001 ETH to join, 0.0001 ETH to continue) make it accessible to everyone
- **📱 Modern Web3 UI**: Clean, responsive interface with RainbowKit wallet integration

## 🎮 How It Works

### Game Flow

1. **Creation Phase**
   - Any player can create a new game by specifying the number of players (2-5)
   - The creator becomes the game master who controls game progression

2. **Joining Phase**
   - Players join an open game by paying the join fee (0.0001 ETH)
   - The join fee is added to the game's prize pot
   - Once the game reaches capacity, no more players can join

3. **Starting Phase**
   - When the game is full, the creator initiates the game
   - The smart contract generates a cryptographic seed using:
     - Block timestamp
     - Previous block randomness (prevrandao)
     - Creator's address
     - Game ID
     - All player addresses
   - Each player receives 3 encrypted dice rolls (values 1-6)
   - Rolls are encrypted using FHEVM and only accessible to the respective player

4. **Decision Phase**
   - Players decrypt their rolls off-chain using the Zama relayer
   - Based on their maximum roll, players choose to:
     - **Continue**: Pay the continue fee (0.0001 ETH) to stay in the game
     - **Fold**: Exit the game without additional cost, forfeiting any chance to win
   - Continue fees are added to the prize pot

5. **Resolution Phase**
   - After all players have made their decisions, the creator opens the game
   - The smart contract determines the winner by comparing maximum rolls among players who continued
   - The winner receives the entire pot
   - If everyone folds, the pot returns to the creator

### Technical Flow

```
Creator Creates Game → Players Join (Pay Join Fee) → Game Full →
Creator Starts Game → Encrypted Dice Generated → Players Decrypt Off-Chain →
Players Continue/Fold → All Decisions Made → Creator Opens → Winner Takes Pot
```

## 🏆 Advantages

### Privacy & Security

- **Zero Knowledge**: Players' dice rolls remain encrypted on-chain; no one can see others' rolls until the game ends
- **Anti-Front-Running**: Encryption prevents malicious actors from exploiting transaction ordering
- **Verifiable Randomness**: Seed generation uses block data, making it deterministic yet unpredictable
- **Smart Contract Security**: Battle-tested Solidity patterns with comprehensive error handling

### User Experience

- **Instant Wallet Connection**: Seamless integration with MetaMask and other Web3 wallets via RainbowKit
- **Real-Time Updates**: Dynamic UI reflects game state changes immediately
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Gas Efficient**: Optimized contract code minimizes transaction costs

### Economic Design

- **Fixed, Predictable Fees**: No hidden costs—join fee and continue fee are constants
- **Winner Takes All**: Simple, transparent prize distribution
- **Creator Incentive**: Creators can reclaim the pot if all players fold
- **No Platform Fees**: 100% of fees go to the prize pool

### Developer Benefits

- **Open Source**: Fully auditable code under BSD-3-Clause license
- **Modular Architecture**: Clean separation between contracts, tests, and frontend
- **Comprehensive Tests**: Full test coverage with Hardhat
- **TypeChain Integration**: Type-safe contract interactions in TypeScript
- **Easy Deployment**: Streamlined deployment scripts for Sepolia testnet

## 🛠️ Technology Stack

### Smart Contracts

- **Solidity 0.8.24**: Latest stable version with Cancun EVM features
- **FHEVM by Zama**: Fully Homomorphic Encryption for on-chain privacy
  - `@fhevm/solidity`: FHE primitives (euint32, encryption/decryption)
  - `@zama-fhe/oracle-solidity`: Decryption oracle integration
- **OpenZeppelin Patterns**: Industry-standard contract patterns for security

### Development Tools

- **Hardhat**: Ethereum development environment
  - Compilation, deployment, testing, and debugging
  - Network forking for local testing
  - Gas reporting and coverage analysis
- **TypeChain**: Automatic TypeScript bindings for contracts
- **Ethers.js v6**: Modern Ethereum library for contract interaction
- **Hardhat Deploy**: Deterministic deployment system
- **Mocha/Chai**: Testing framework with assertion library

### Frontend

- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **Wagmi v2**: React hooks for Ethereum
- **RainbowKit**: Beautiful wallet connection UI
- **TanStack Query**: Powerful data synchronization
- **Tailwind CSS**: Utility-first styling (via custom styles)

### Infrastructure

- **Ethereum Sepolia Testnet**: Deployed and live for testing
- **Infura**: Reliable node infrastructure
- **FHEVM Coprocessor**: Zama's FHE computation service
- **Relayer SDK**: Decryption gateway for encrypted data

## 🧩 Problem Solving

### Problems Addressed

1. **Lack of Privacy in Blockchain Games**
   - **Problem**: Traditional blockchain games expose all player data, enabling front-running and unfair advantages
   - **Solution**: FHEVM encrypts sensitive game state, ensuring privacy without sacrificing verifiability

2. **Trust Requirements in Online Gaming**
   - **Problem**: Centralized gaming platforms require trust in operators for fair randomness and payouts
   - **Solution**: Smart contracts provide trustless, verifiable randomness and automatic payouts

3. **High Barriers to Entry**
   - **Problem**: Many blockchain games have high gas fees or expensive NFT requirements
   - **Solution**: Minimal fixed fees (0.0001 ETH) make the game accessible to casual players

4. **Complex User Onboarding**
   - **Problem**: Web3 applications often have steep learning curves
   - **Solution**: Intuitive UI with familiar game mechanics (dice rolling, betting)

5. **Limited On-Chain Privacy Tools**
   - **Problem**: Few production-ready privacy solutions exist for Ethereum
   - **Solution**: Demonstrates practical use of FHEVM in a real-world application

### Technical Challenges Overcome

- **Efficient FHE Operations**: Optimized contract code to minimize gas costs for FHE operations
- **Relayer Integration**: Seamless off-chain decryption without compromising security
- **State Synchronization**: Real-time UI updates for multi-player game state changes
- **Wallet Compatibility**: Support for major Ethereum wallets via standardized interfaces
- **Deterministic Randomness**: Fair dice generation using block data without oracles

## 📦 Project Structure

```
NumberGamble/
├── contracts/
│   └── NumberGamble.sol          # Main game contract with FHE logic
├── deploy/
│   ├── deploy.ts                 # Legacy deployment script
│   └── deployNumberGamble.ts     # Production deployment configuration
├── test/
│   └── NumberGamble.test.ts      # Comprehensive contract tests
├── src/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NumberGambleApp.tsx   # Main application component
│   │   │   ├── Header.tsx            # Navigation header
│   │   │   └── pages/
│   │   │       ├── CreateGame.tsx    # Game creation interface
│   │   │       ├── GamesList.tsx     # Browse all games
│   │   │       └── MyGames.tsx       # User's active games
│   │   ├── hooks/
│   │   │   ├── useZamaInstance.ts    # FHEVM instance management
│   │   │   └── useEthersSigner.ts    # Wallet signer hook
│   │   ├── config/
│   │   │   └── wagmi.ts              # Wagmi/RainbowKit configuration
│   │   ├── App.tsx                   # Root component
│   │   └── main.tsx                  # Application entry point
│   ├── vite.config.ts                # Vite build configuration
│   └── package.json                  # Frontend dependencies
├── tasks/
│   ├── accounts.ts                   # Hardhat task for account management
│   └── FHECounter.ts                 # Example FHE task
├── types/                            # TypeChain generated types
├── hardhat.config.ts                 # Hardhat configuration
├── package.json                      # Root project dependencies
├── tsconfig.json                     # TypeScript configuration
└── vite.config.ts                    # Vite configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js**: ≥20.x
- **npm**: ≥7.0.0
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH**: For testnet deployment and gameplay (get from [Sepolia Faucet](https://sepoliafaucet.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/NumberGamble.git
   cd NumberGamble
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd src
   npm install
   cd ..
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:
   ```env
   PRIVATE_KEY=your_private_key_here
   INFURA_API_KEY=your_infura_api_key
   ETHERSCAN_API_KEY=your_etherscan_api_key  # Optional for verification
   ```

### Compilation

```bash
# Compile contracts
npm run compile

# Generate TypeScript types
npm run typechain
```

### Testing

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run coverage
npm run coverage
```

### Deployment

#### Local Development

1. **Start local Hardhat node**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts locally**
   ```bash
   npx hardhat deploy --network localhost
   ```

#### Sepolia Testnet

1. **Deploy to Sepolia**
   ```bash
   npm run deploy:sepolia
   ```

2. **Verify contract (optional)**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

### Running the Frontend

1. **Update contract address**
   - After deployment, update the contract address in `src/src/config/wagmi.ts`

2. **Start development server**
   ```bash
   cd src
   npm run dev
   ```

3. **Access the app**
   - Open your browser to `http://localhost:5173`
   - Connect your MetaMask wallet (switch to Sepolia network)
   - Start creating or joining games!

## 📖 Usage Guide

### Creating a Game

1. Navigate to the **Create Game** tab
2. Select the number of players (2-5)
3. Click **Create Game** and confirm the transaction
4. Share the game ID with other players

### Joining a Game

1. Go to the **All Games** tab
2. Find an open game with available slots
3. Click **Join** and pay the join fee (0.0001 ETH)
4. Wait for the game to fill up

### Playing a Game

1. Once full, the creator clicks **Start Game**
2. View your encrypted dice rolls in **My Games**
3. Click **Decrypt Rolls** to reveal your private numbers
4. Decide based on your maximum roll:
   - If high (5-6): Click **Continue** and pay 0.0001 ETH
   - If low (1-3): Consider clicking **Fold** to save the fee
   - If medium (4): Strategic decision based on pot size
5. After all players decide, the creator clicks **Open Game**
6. Winner receives the pot automatically!

### Strategy Tips

- **High Rolls (6)**: Always continue—you have the best chance to win
- **Good Rolls (5)**: Continue in most cases, especially with 3+ players
- **Medium Rolls (4)**: Calculate pot odds—continue if pot is large relative to continue fee
- **Low Rolls (1-3)**: Usually fold to minimize losses
- **Game Theory**: Consider how many players might fold—fewer continuers increase your odds

## 🗺️ Roadmap & Future Plans

### Phase 1: Core Enhancements (Q1 2025)

- [ ] **Multi-Network Support**
  - Deploy to Ethereum mainnet
  - Support Polygon, Arbitrum, and Optimism
  - Cross-chain gaming via LayerZero or similar

- [ ] **Advanced Game Modes**
  - Tournament mode with bracket system
  - Progressive jackpot accumulation
  - Team-based competitions
  - Speed rounds with faster decision timers

- [ ] **Enhanced Privacy Features**
  - Private game lobbies with invite-only access
  - Anonymous player mode using zero-knowledge proofs
  - Encrypted chat between players

### Phase 2: Platform Expansion (Q2 2025)

- [ ] **Social Features**
  - Player profiles with statistics and achievements
  - Leaderboards (daily, weekly, all-time)
  - Friend lists and private messaging
  - Replay system to review past games

- [ ] **Tokenomics**
  - Native governance token (e.g., $DICE)
  - Staking for reduced fees or exclusive games
  - NFT rewards for achievements
  - Deflationary mechanisms (token burns)

- [ ] **Developer Ecosystem**
  - SDK for building custom game modes
  - Plugin system for UI themes
  - API for third-party integrations
  - Developer grants program

### Phase 3: Advanced Features (Q3 2025)

- [ ] **AI Integration**
  - Optional AI opponents for solo play
  - Bot detection and prevention
  - Automated game matchmaking

- [ ] **Mobile Applications**
  - Native iOS app
  - Native Android app
  - Push notifications for game events
  - Mobile wallet integration

- [ ] **DeFi Integration**
  - Liquidity pools for game bankrolls
  - Yield farming for token holders
  - Decentralized insurance for pots
  - Integration with major DeFi protocols

### Phase 4: Governance & Decentralization (Q4 2025)

- [ ] **DAO Formation**
  - Community governance for game parameters
  - Voting on new features and game modes
  - Treasury management by token holders
  - Proposal and voting infrastructure

- [ ] **Protocol Improvements**
  - Gas optimization upgrades
  - Layer 2 scalability solutions
  - Advanced cryptographic primitives
  - Formal security audits

- [ ] **Ecosystem Growth**
  - Partnerships with other gaming platforms
  - Integration into metaverse projects
  - Educational initiatives for FHE technology
  - Open source community building

### Long-Term Vision

- **Become the Leading FHE Gaming Platform**: Establish NumberGamble as the premier example of privacy-preserving on-chain gaming
- **Drive FHE Adoption**: Educate developers and users about practical applications of fully homomorphic encryption
- **Build a Thriving Ecosystem**: Foster a community of players, developers, and contributors around fair and private gaming
- **Expand Beyond Dice**: Create a suite of privacy-preserving games (poker, blackjack, lottery, etc.)
- **Research & Development**: Invest in advancing FHE technology for gaming applications

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or suggesting new ideas, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write or update tests**
5. **Run linting and tests** (`npm run lint && npm test`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to your branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (enforced by ESLint and Prettier)
- Write comprehensive tests for new features
- Update documentation for API changes
- Keep commits atomic and well-described
- Ensure all tests pass before submitting

### Areas for Contribution

- Smart contract optimizations
- Frontend UI/UX improvements
- Additional game modes
- Test coverage expansion
- Documentation enhancements
- Bug fixes and issue resolution

## 🔒 Security

### Audit Status

This project is currently **unaudited**. While we've implemented best practices and comprehensive tests, use at your own risk, especially on mainnet.

### Known Considerations

- FHE operations are computationally expensive; gas costs may be high on mainnet
- Relayer dependency for decryption introduces a trust assumption (mitigated by Zama's infrastructure)
- Front-running prevention relies on FHE encryption remaining secure

### Reporting Vulnerabilities

If you discover a security vulnerability, please email us at **security@yourdomain.com** instead of opening a public issue. We'll respond promptly and work with you to address the issue.

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama.ai**: For developing FHEVM and advancing practical FHE applications
- **Hardhat**: For the excellent Ethereum development environment
- **RainbowKit**: For the seamless wallet connection experience
- **OpenZeppelin**: For battle-tested smart contract libraries
- **The Ethereum Community**: For building the decentralized future

## 📞 Contact & Community

- **GitHub**: [github.com/yourusername/NumberGamble](https://github.com/yourusername/NumberGamble)
- **Discord**: [Join our community](#) (coming soon)
- **Twitter**: [@NumberGamble](#) (coming soon)
- **Documentation**: [docs.numbergamble.xyz](#) (coming soon)

## 🎯 Quick Links

- [Live Demo on Sepolia](https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS)
- [Smart Contract Documentation](./docs/contracts.md)
- [Frontend Architecture](./docs/frontend.md)
- [Deployment Guide](./docs/deployment.md)
- [API Reference](./docs/api.md)

---

**Built with ❤️ and 🔐 by the NumberGamble Team**

*Experience the future of fair, private, decentralized gaming.*