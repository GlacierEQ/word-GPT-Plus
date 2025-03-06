<div align="center">
  <a href="https://github.com/Kuingsmile/word-GPT-Plus">
    <img src="https://user-images.githubusercontent.com/96409857/233920113-b6919e19-484e-4a4b-82ff-5c72f7314025.png" alt="Logo" height="100">
  </a>

  <h2 align="center">Word GPT Plus</h2>
  <p align="center">
    Integrate AI directly into Microsoft Word
    <br />
    <a href="#features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a>
  </p>
</div>

English | [简体中文](https://github.com/Kuingsmile/word-GPT-Plus/blob/master/README_cn.md)

## 📋 Introduction

Word GPT Plus seamlessly integrates AI models into Microsoft Word, allowing you to generate, translate, summarize, and polish text directly within your documents. Enhance your writing workflow without leaving your Word environment.

<p align="center">
  <img src="https://user-images.githubusercontent.com/96409857/233878627-6b5abdfd-7ff6-4818-8b26-d78f74ea0e85.gif" width="45%" />
  <img src="https://user-images.githubusercontent.com/96409857/233878368-3a793d8b-3740-4471-822b-0e062415b704.gif" width="45%" />
</p>

## ✨ Features

- **Multiple AI Models Support**:
  - OpenAI API (compatible with DeepSeek and other OpenAI-compatible endpoints)
  - Azure OpenAI API
  - Google Gemini Pro API
  - Ollama (for local deployment)
  - Groq API

- **Built-in Templates**:
  - Translation (40+ languages)
  - Text polishing and improvement
  - Academic writing enhancement
  - Content summarization
  - Grammar checking

- **Customization Options**:
  - Save custom prompts for repeated use
  - Adjust temperature and max tokens
  - Support for proxies
  - Local storage for privacy

## 🚀 Getting Started

### Requirements

#### Software
- Microsoft Word 2016/2019 (retail version), Word 2021, or Microsoft 365
- [Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
- Node.js 18+ (only for self-hosting)

> **Note**: Works only with .docx files (not compatible with older .doc format)

#### API Access
- **OpenAI**: Obtain an API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
- **Azure OpenAI**: Apply for access at [Azure OpenAI Service](https://go.microsoft.com/fwlink/?linkid=2222006)
- **Google Gemini**: Request API access from [Google AI Studio](https://developers.generativeai.google/)
- **Groq**: Get your API key from [Groq Console](https://console.groq.com/keys)

## 💻 Installation

Choose one of the following installation methods:

### Option 1: Use Hosted Service (Recommended)

1. Download [manifest.xml](https://github.com/Kuingsmile/word-GPT-Plus/blob/master/release/instant-use/manifest.xml)
2. Save it to a directory on your computer (e.g., `C:\Users\username\Documents\WordGPT`)
3. Follow the [Add-in Installation Guide](#adding-the-add-in-to-word) below

> **Note for users in China**: If you experience connectivity issues, try adding `msq.pub` to your proxy rules or use the self-hosted option.

### Option 2: Docker Deployment

```bash
docker pull kuingsmile/word-gpt-plus
docker run -d -p 3000:80 kuingsmile/word-gpt-plus
```

You need to modify all `[localhost:3000](http://localhost:3000)` in manifest.xml to your server address.

Follow the [Add-in Installation Guide](#adding-the-add-in-to-word) below.

### Option 3: Self-hosted

If you want to host the add-in yourself, you will need to clone this repo and install dependencies, then run the project. Need Node.js 16+.

```bash
git clone https://github.com/Kuingsmile/Word-GPT-Plus.git
yarn
yarn run serve
```

[manifest.xml](https://github.com/Kuingsmile/word-GPT-Plus/blob/master/release/self-hosted/manifest.xml)

Then, follow the [Add-in Installation Guide](#adding-the-add-in-to-word) below.

### Add-in Installation Guide

To get started with Word GPT Plus, you will need to sideload the add-in into Microsoft Word.

You can find instructions provided by MicroSoft at the following link: [sideload office add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins)

1. Go to the folder where you saved the `manifest.xml` file, for example `C:\Users\username\Documents\WordGPT`.
2. Open the context menu for the folder(right-click the folder) and select **Properties**.
3. Within the **Properties** dialog box, select the **Sharing** tab, and then select **Share**.
![image](https://learn.microsoft.com/en-us/office/dev/add-ins/images/sideload-windows-properties-dialog.png)
4. Within the **Network access** dialog box, add yourself and any other users you want to share, choose the **Share** button, When you see confirmation that Your folder is shared, note the **full network path** that's displayed immediately following the folder name.
![image](https://learn.microsoft.com/en-us/office/dev/add-ins/images/sideload-windows-network-access-dialog.png)
5. Open a new document in Word, choose the **File** tab, and then choose **Options**.
6. Choose **Trust Center**, and then choose the **Trust Center Settings** button.
7. Choose **Trusted Add-in Catalogs**.
8. In the **Catalog Url** box, enter the **full network path** and then choose **Add Catalog**.
9. Select the **Show in Menu** check box, and then choose **OK**.
![image](https://learn.microsoft.com/en-us/office/dev/add-ins/images/sideload-windows-trust-center-dialog.png)
10. Close and then restart Word.
11. Click **Insert** > **My Add-ins** > **Shared Folder**, choose **GPT Plus**, and then choose **Add**.
12. Enjoy it!
![image](https://user-images.githubusercontent.com/96409857/234744280-9d9f13cf-536b-4fb5-adfa-cbec262d56a2.png)

## How to fill in API key

After entering Word GPT Plus, click the orange `Settings` button on the homepage to enter the settings page, where you can switch APIs and fill in API keys.

## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request.

## License

MIT License

## Show your support

Give a ⭐️ if this project helped you!

# Word GPT Plus

Advanced AI assistant for Microsoft Word with local models and recursive optimization

## Features

- 🚀 **Multiverse Writing**: Generate multiple variations of text in different styles
- 🔍 **Recursive Optimization**: Iteratively improve content quality through AI feedback cycles
- 🧠 **Local Models**: Support for running local AI models for privacy and offline use
- 📊 **Quality Standards**: Built-in quality metrics and standards enforcement
- 🏢 **Enterprise Security**: Advanced security protocols for sensitive content
- 📋 **Workflow Automation**: Automated document improvement workflows
- 📈 **Analytics Dashboard**: Track usage and quality metrics

## Installation

### Requirements

- Microsoft Word 2016 or later
- Windows 10/11 or macOS 10.15+
- For local models: 8GB+ RAM, 10GB+ disk space

### Quick Start

1. **Download the add-in package**
   - Download the latest release from the Releases page

2. **Install the add-in in Word**
   - Open Word
   - Go to Insert > Add-ins > My Add-ins
   - Choose "Upload My Add-in" and select the downloaded manifest file

3. **Configuration**
   - When first launched, choose your preferred AI provider
   - For API models: Enter your API key
   - For local models: Download your preferred model when prompted

## Using Word GPT Plus

### Content Generation

1. Place your cursor where you want to insert content
2. Open the Word GPT Plus sidebar
3. Enter your prompt in the "Generate" tab
4. Click "Generate" to create content
5. Click "Insert" to add the content to your document

### Multiverse Writing

1. Select text you want to transform
2. Go to the "Multiverse" tab
3. Choose your desired style variations
4. Click "Generate Variants"
5. Select your preferred version to insert

### Perfect Text

1. Select text you want to optimize
2. Go to the "Perfect" tab
3. Choose optimization options
4. Click "Perfect Selected Text"
5. Review and insert the improved version

### Quality Analytics

1. Go to the "Analytics" tab to view document quality metrics
2. See suggestions for improvement
3. Track your writing quality over time

## Advanced Features

### Local Model Management

Word GPT Plus supports several quantized local models:

- Llama 2 (7B 4-bit)
- Mistral (7B 4-bit)
- Phi-2 (4-bit)

Download and manage models in the Settings tab.

### Security Options

- **Content Scanning**: Automatically detect sensitive information
- **Data Minimization**: Remove unnecessary personal data
- **Encryption**: Secure API keys and sensitive content

### Adaptive Learning

The add-in learns from your preferences over time:

- Writing style preferences
- Content density preferences
- Content format preferences
- Frequently used concepts

## Development

### Building from Source

1. Clone the repository.
2. Navigate to the project directory.
3. Run `npm install` to install dependencies and build the project.
4. Follow the instructions in the Microsoft documentation to sideload the add-in into Word.

## Usage

<!-- Add usage instructions here -->
