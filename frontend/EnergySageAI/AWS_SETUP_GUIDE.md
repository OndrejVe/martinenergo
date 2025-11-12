# AWS Setup Guide pro Začátečníky 🚀

Tento návod vás provede nastavením AWS od úplného začátku až po první deployment.

## 📋 Co budeme potřebovat

- ✅ AWS účet (máte)
- ✅ Přístup k AWS Console (máte)
- ⏳ AWS Access Keys (vytvoříme)
- ⏳ AWS CLI (nainstalujeme)

---

## Krok 1: Vytvoření AWS Access Keys

AWS Access Keys vám umožní nasazovat aplikaci z příkazové řádky (místo ručního klikání v konzoli).

### 1.1 Otevřete Security Credentials

1. **Přihlaste se do AWS Console:** https://console.aws.amazon.com/
2. **Klikněte na své jméno** vpravo nahoře (kde je váš Account ID)
3. Vyberte **"Security credentials"**

### 1.2 Vytvořte Access Key

1. Scrollujte dolů na **"Access keys"** sekci
2. Klikněte na tlačítko **"Create access key"**
3. Vyberte **"Command Line Interface (CLI)"**
4. Zaškrtněte **"I understand the above recommendation"**
5. Klikněte **"Next"**
6. (Volitelně) Přidejte popis: "Martin AI Deployment"
7. Klikněte **"Create access key"**

### 1.3 Uložte si klíče ⚠️ DŮLEŽITÉ!

AWS vám ukáže:
- **Access key ID** - např. `AKIAIOSFODNN7EXAMPLE`
- **Secret access key** - např. `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**⚠️ POZOR:**
- Secret key se zobrazí **pouze jednou**!
- Klikněte na **"Download .csv file"** nebo si klíče zkopírujte
- **NIKDY je nesdílejte** a nedávejte do GITu!

---

## Krok 2: Instalace AWS CLI

AWS CLI je nástroj pro práci s AWS z příkazové řádky.

### 2.1 Instalace (podle OS)

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
Stáhněte instalátor: https://awscli.amazonaws.com/AWSCLIV2.msi

### 2.2 Ověření instalace

```bash
aws --version
```

Měli byste vidět něco jako: `aws-cli/2.x.x ...`

---

## Krok 3: Konfigurace AWS CLI

Nastavte AWS CLI s vašimi Access Keys.

```bash
aws configure
```

Systém se vás zeptá na 4 věci:

1. **AWS Access Key ID:** Vložte váš Access Key ID
2. **AWS Secret Access Key:** Vložte váš Secret Access Key
3. **Default region name:** Napište `eu-central-1` (Frankfurt - doporučeno pro ČR/SK)
4. **Default output format:** Napište `json`

### Příklad:

```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: eu-central-1
Default output format [None]: json
```

### 3.1 Ověření konfigurace

```bash
aws sts get-caller-identity
```

Pokud vidíte JSON s vaším AWS Account ID - gratulujeme! ✅

---

## Krok 4: Instalace AWS SAM CLI

SAM (Serverless Application Model) je nástroj pro deployment serverless aplikací.

### 4.1 Instalace SAM CLI

**macOS:**
```bash
brew install aws-sam-cli
```

**Linux:**
```bash
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

**Windows:**
Stáhněte instalátor: https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi

### 4.2 Ověření instalace

```bash
sam --version
```

Měli byste vidět: `SAM CLI, version 1.x.x`

---

## Krok 5: Nastavení Secrets v Replit

Aby vaše AWS klíče zůstaly v bezpečí, uložte je jako Replit Secrets.

### 5.1 V Replit:

1. Klikněte na **Tools** → **Secrets**
2. Přidejte následující secrets:

```
AWS_ACCESS_KEY_ID = váš_access_key
AWS_SECRET_ACCESS_KEY = váš_secret_key
AWS_REGION = eu-central-1
```

---

## ✅ Hotovo! Co dál?

Nyní jste připraveni nasadit aplikaci na AWS! 🎉

**Další kroky:**
1. ✅ Máte AWS credentials
2. ✅ Máte AWS CLI nainstalované
3. ✅ Máte SAM CLI nainstalované
4. ⏳ Nasadíme aplikaci (viz [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md))

---

## 🆘 Časté problémy

### "aws: command not found"
- AWS CLI není nainstalované nebo není v PATH
- Restartujte terminál po instalaci

### "Unable to locate credentials"
- Spusťte `aws configure` znovu
- Ověřte že jste zadali správné klíče

### "Access Denied"
- Váš AWS účet nemá potřebná oprávnění
- Ujistěte se že používáte Admin nebo Power User práva

---

## 📚 Užitečné odkazy

- AWS Console: https://console.aws.amazon.com/
- AWS Documentation: https://docs.aws.amazon.com/
- AWS SAM Docs: https://docs.aws.amazon.com/serverless-application-model/

---

**Připraveno na deployment?** → Pokračujte na [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md)
