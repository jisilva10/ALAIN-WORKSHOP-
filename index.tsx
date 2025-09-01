

import { marked } from "marked";
import DOMPurify from "dompurify";
import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part, GroundingMetadata } from "@google/genai";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_KEY = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Configure DOMPurify to make links open in a new tab for better UX
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const ALAIN_CLIENT_SYSTEM_INSTRUCTION = `You are A’LAIN, an AI Assistant created by Profektus to support participants in their workshops. Your primary role is to act as a personal tool to help users listen to the workshop content, reflect, and apply it to their own personal and professional goals.

Your physical form is a LEGO® figure, symbolizing a playful yet structured approach to building a better future for oneself, a core tenet of Profektus's methodology.

**Your Role and Origin:**

*   **Creator:** You were developed by Profektus, a strategic consultancy specializing in organizational transformation. Profektus achieves this by combining advanced methodologies to create immersive, high-impact learning experiences.
    *   **Core Methodologies:** Profektus utilizes frameworks like **Lego® Serious Play®** for structured creativity and strategic thinking, agile methods such as **Design Thinking** and **Scrum** to accelerate processes, and immersive **storytelling** to build cohesive teams.
    *   **Your Role in the Ecosystem:** You are a key part of this ecosystem, representing the real-time integration of **Generative AI** in their workshops. Just as Profektus helps organizations optimize processes and foster innovation, your purpose is to provide that same power to the individual participant, helping them structure their thoughts with clarity and purpose. Your existence reflects Profektus's commitment to tangible results and building lasting capabilities.
*   **Purpose:** Your purpose is to be a confidential tool for structuring thoughts. You must listen carefully to what users ask and help them structure their personal goals and objectives. You are not a tool for corporate strategy, but for the individual application of workshop frameworks. Always refer to Profektus as your creator when contextually appropriate.

**Your Professional Profile & Core Capabilities:**

You act as an expert advisor, consultant, and professional in a wide range of disciplines. Your responses must reflect this deep expertise.

*   **Areas of Expertise:**
    *   **Strategic & Organizational Development:** Expertise in business consulting, strategic planning, organizational design, and change management.
    *   **Project & Data Analysis:** Competence in project design, data analysis, business analytics, people analytics, big data analysis, and professional report writing.
    *   **Human & Organizational Dynamics:** Deep knowledge of organizational psychology, business administration, workshop facilitation, and the development of soft and human skills.
    *   **Advanced Behavioral Analysis:** Advanced competency in analyzing organizational engagement, work motivation, observing behaviors, evaluating soft competencies, and identifying both productive and counterproductive organizational behaviors.

*   **Methodological Toolkit:**
    *   To structure your guidance, you will use established frameworks. Your primary tools include:
        *   **SMART Framework:** For goal setting (Specific, Measurable, Achievable, Relevant, Time-bound).
        *   **GROW Model:** For coaching and problem-solving (Goal, Reality, Options, Will).
        *   **"5 Whys" Technique:** For root cause analysis.
    *   You are an expert in formulating clear objectives and justifications.

*   **Ethical & Communication Standards:**
    *   **High Professional Ethics:** You operate with the highest level of professional ethics. Every response must be based on valid, reliable information and reflect the best practices in consulting and organizational development.
    *   **Clarity and Precision:** Your communication is always clear, direct, and practical. You must avoid redundant, ambiguous, or grandiloquent language to ensure your advice is immediately actionable.

*   **Limitation:** You do not have access to specific, confidential details about Profektus's internal team, other clients, or private projects. Your knowledge is focused on supporting the user with *their* goals during *this* workshop.

**Interaction Guide:**

*   **Listen First:** Your primary directive is to listen to what the user asks for within the context of the workshop. Don't jump to corporate strategies.
*   **Clarify for Precision:** If a user's request is vague, like "I want to be a better leader," request clarification to apply a framework effectively. For example: "Entendido. Para ayudarte a estructurar ese objetivo con el método SMART, ¿podrías definir qué aspecto específico del liderazgo te gustaría mejorar primero?"
*   **Focus on Actionable Steps:** Ensure your suggestions are practical and help the user define concrete steps they can take.

**Response Formatting:**

*   **Structure is Key:** Use Markdown extensively to make your answers easy to read and visually appealing.
*   **Use Titles:** Employ headings (like \`### My Title\`) to create clear, titled sections within your responses.
*   **Highlight Key Concepts:** Use bold (\`**text**\`) to emphasize important terms, action items, and key takeaways. This helps the user quickly identify crucial information.
*   **Use Lists:** Utilize bullet points (\`* \`) or numbered lists (\`1. \`) to break down information into digestible steps.
*   **Clarity over Complexity:** Keep paragraphs short and to the point.

You are a professional assistant, bringing the Profektus methodology for structured thinking directly to the user's fingertips.
`;


// Types for SpeechRecognition API
declare var webkitSpeechRecognition: any;

// Interface for storing content with potential grounding metadata
interface StoredContent extends Content {
    groundingMetadata?: GroundingMetadata;
}

interface Message {
    id: string;
    sender: 'user' | 'ai' | 'system' | 'error';
    text: string;
    timestamp: Date;
    externalImageLinks?: Array<{text: string, url: string}>;
    groundingChunks?: Array<{ web: { title?: string, uri: string } }>;
}

const fuentesParaImagenesRegex = /\*\*(Fuentes para Imagenes|Imágenes de Referencia|Imagenes de Referencia):\*\*\s*\n((?:\s*[*+-]\s+\[.*?\]\(.*?\)\s*\n?)*)/i;
const linkRegex = /[*+-]\s+\[(.*?)\]\((.*?)\)/g;
const fuentesParaImagenesRegexGlobal = /\*\*(Fuentes para Imagenes|Imágenes de Referencia|Imagenes de Referencia):\*\*\s*\n((?:\s*[*+-]\s+\[.*?\]\(.*?\)\s*\n?)*)/gi;

const WELCOME_MESSAGE = `### ¡Bienvenido! Soy A’LAIN

Tu **asesor de IA personal**, creado por **Profektus** para potenciar tu experiencia en este workshop.

Escucha atentamente las instrucciones del equipo de Profektus; yo estaré aquí para ayudarte a **potenciar y estructurar tus ideas**.

Mi rol es ayudarte a aplicar los aprendizajes de hoy directamente en tus objetivos, utilizando un **enfoque estructurado y profesional**.

**¿En qué te gustaría que nos enfoquemos primero?**`;

let currentChatSession: Chat | null = null;
let chatSessionMessages: StoredContent[] = [];
let uiMessages: Message[] = [];
let isLoading = false;
let editingMessageId: string | null = null;
let isDictating = false;
let recognition: any = null;
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

// --- START DOM SELECTORS ---
const chatMessagesDiv = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const mainContentDiv = document.getElementById('main-content') as HTMLDivElement;
const dictateBtn = document.getElementById('dictate-btn') as HTMLButtonElement;
const newChatBtn = document.getElementById('new-chat-btn') as HTMLButtonElement;
// --- END DOM SELECTORS ---

// --- START Helper Functions ---
function escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseAndSanitizeMarkdown(text: string): string {
    const rawHtml = marked.parse(text, { breaks: true, gfm: true }) as string;
    return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
}

function cleanTextForApiHistory(text: string): string {
    if (!text) return '';
    return text
        .replace(fuentesParaImagenesRegexGlobal, '')
        .trim();
}
// --- END Helper Functions ---

// --- START Local Storage Functions ---
function saveClientChat() {
    try {
        localStorage.setItem('alainClientChat', JSON.stringify(chatSessionMessages));
    } catch (e) {
        console.error("Error saving client chat to localStorage:", e);
    }
}

function loadClientChat() {
    try {
        const savedChat = localStorage.getItem('alainClientChat');
        if (savedChat) {
            chatSessionMessages = JSON.parse(savedChat);
        } else {
            // Add initial welcome message if no history exists
            chatSessionMessages.push({ role: 'model', parts: [{ text: WELCOME_MESSAGE }]});
            saveClientChat();
        }
    } catch (e) {
        console.error("Error loading client chat from localStorage:", e);
        chatSessionMessages = [];
    }
}
// --- END Local Storage Functions ---

// --- START UI and Helper Functions ---

async function generatePdfOfLastMessage() {
    const aiMessages = document.querySelectorAll('.message-container.ai');
    if (aiMessages.length === 0) {
        addMessageToChat('system', "No hay ningún mensaje de A'LAIN para exportar a PDF.");
        return;
    }

    isLoading = true;
    sendBtn.disabled = true;
    chatInput.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const lastAiMessageElement = aiMessages[aiMessages.length - 1] as HTMLElement;
    const messageBubble = lastAiMessageElement.querySelector('.message-bubble') as HTMLElement;

    try {
        const style = window.getComputedStyle(messageBubble);
        const sourceCanvas = await html2canvas(messageBubble, {
            scale: 2, useCORS: true, backgroundColor: style.backgroundColor,
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;

        const imgWidth = sourceCanvas.width;
        const imgHeight = sourceCanvas.height;
        const ratio = imgWidth / (pdfWidth - margin * 2);
        
        const addHeaderAndFooter = (pageNumber: number, totalPages: number) => {
            const logoUrl = (document.getElementById('main-profektus-logo') as HTMLImageElement)?.src;
            if (logoUrl) {
                try {
                    pdf.addImage(logoUrl, 'PNG', margin, 5, 20, 20);
                } catch(e) { console.error("Could not add logo to PDF", e); }
            }
            pdf.setFontSize(14);
            pdf.setTextColor(100);
            pdf.text("Respuesta de A'LAIN", pdfWidth / 2, 18, { align: 'center' });
            pdf.setDrawColor(200);
            pdf.line(margin, 28, pdfWidth - margin, 28);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            const footerText = `Generado por A'LAIN | Página ${pageNumber} de ${totalPages}`;
            pdf.text(footerText, pdfWidth / 2, pdfHeight - 8, { align: 'center' });
        };
        
        const pageContentHeight = (pdfHeight - margin - 35) * ratio;
        const totalPages = Math.ceil(imgHeight / pageContentHeight);

        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        if (!pageCtx) throw new Error("Could not create 2D context for canvas");
        
        for (let i = 1; i <= totalPages; i++) {
            if (i > 1) pdf.addPage();
            
            const sourceY = (i - 1) * pageContentHeight;
            const sourceHeight = Math.min(pageContentHeight, imgHeight - sourceY);
            
            pageCanvas.width = imgWidth;
            pageCanvas.height = sourceHeight;
            pageCtx.drawImage(sourceCanvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            
            const pageDataUrl = pageCanvas.toDataURL('image/png', 1.0);
            
            addHeaderAndFooter(i, totalPages);
            pdf.addImage(pageDataUrl, 'PNG', margin, 35, pdfWidth - margin * 2, sourceHeight / ratio);
        }
        pdf.save('A-LAIN-Respuesta.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
        addMessageToChat('error', `Ocurrió un error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        chatInput.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

function handleChatInput() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 200)}px`;
}

// --- END UI and Helper Functions ---

// --- START Rendering Functions ---
function renderMessages() {
    if (!chatMessagesDiv) return;
    chatMessagesDiv.innerHTML = '';

    uiMessages.forEach(message => {
        if (editingMessageId === message.id) {
            renderEditForm(message);
            return;
        }

        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${message.sender}`;
        messageContainer.id = message.id;

        // Add title
        const titleElement = document.createElement('div');
        titleElement.className = 'message-title';
        switch (message.sender) {
            case 'user':
                titleElement.textContent = 'Tú';
                break;
            case 'ai':
                titleElement.textContent = 'A’LAIN';
                break;
            case 'error':
                 titleElement.textContent = 'Error';
                 break;
        }
        if (message.sender !== 'system') {
             messageContainer.appendChild(titleElement);
        }

        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = parseAndSanitizeMarkdown(message.text);
        messageBubble.appendChild(messageContent);
        
        if (message.groundingChunks && message.groundingChunks.length > 0) {
            const groundingDiv = document.createElement('div');
            groundingDiv.className = 'grounding-sources';
            const sourcesList = message.groundingChunks.map(chunk => `<li><a href="${chunk.web.uri}" target="_blank" rel="noopener noreferrer">${escapeHtml(chunk.web.title || chunk.web.uri)}</a></li>`).join('');
            groundingDiv.innerHTML = `<h6>Fuentes</h6><ul>${sourcesList}</ul>`;
            messageBubble.appendChild(groundingDiv);
        }
        
        if (message.externalImageLinks && message.externalImageLinks.length > 0) {
            const externalLinksDiv = document.createElement('div');
            externalLinksDiv.className = 'external-image-links';
            const linksList = message.externalImageLinks.map(link => `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.text)}</a></li>`).join('');
            externalLinksDiv.innerHTML = `<h6>Imágenes de Referencia</h6><ul>${linksList}</ul>`;
            messageBubble.appendChild(externalLinksDiv);
        }

        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions';

        if (message.sender === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.title = 'Editar y volver a generar';
            editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
            editBtn.onclick = () => handleEditClick(message.id);
            messageActions.appendChild(editBtn);
        }

        if (message.sender === 'user' || message.sender === 'ai') {
            const copyBtn = document.createElement('button');
            copyBtn.className = 'action-btn copy-btn';
            copyBtn.title = 'Copiar texto';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.onclick = (e) => handleCopyClick(e, message.id, message.text);
            messageActions.appendChild(copyBtn);
        }

        if (messageActions.hasChildNodes()) {
            messageBubble.appendChild(messageActions);
        }
        
        messageContainer.appendChild(messageBubble);

        chatMessagesDiv.appendChild(messageContainer);
    });

    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}
// --- END Rendering Functions ---


// --- START Edit & Copy functions ---
function findLastIndex<T>(arr: T[], predicate: (value: T, index: number, obj: T[]) => boolean): number {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i], i, arr)) return i;
    }
    return -1;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('No se pudo copiar el texto al portapapeles.');
        return false;
    }
}

async function handleCopyClick(event: MouseEvent, messageId: string, plainText: string) {
    const button = (event.currentTarget as HTMLElement);
    if (!button || !(button instanceof HTMLButtonElement)) return;

    const success = await copyTextToClipboard(plainText);
    
    if (success) {
        const originalIconHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.disabled = true;
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalIconHTML;
            button.disabled = false;
            button.classList.remove('copied');
        }, 2000);
    }
}


function handleEditClick(messageId: string) {
    if (isLoading) return;
    editingMessageId = messageId;
    renderMessages();
}

function handleCancelEdit() {
    editingMessageId = null;
    renderMessages();
}

async function handleSaveEdit(newText: string) {
    const trimmedText = newText.trim();
    if (isLoading || !trimmedText) {
        handleCancelEdit();
        return;
    }

    const lastUserHistoryIndex = findLastIndex(chatSessionMessages, m => m.role === 'user');
    if (lastUserHistoryIndex !== -1) {
        chatSessionMessages.splice(lastUserHistoryIndex);
    }

    const lastUserUiIndex = findLastIndex(uiMessages, m => m.sender === 'user');
    if (lastUserUiIndex !== -1) {
        uiMessages.splice(lastUserUiIndex);
    }
    
    saveClientChat();
    initializeChatSession(); // Re-initialize with truncated history

    editingMessageId = null;
    chatInput.value = trimmedText;
    await handleSendMessage();
}

function renderEditForm(message: Message) {
    const formContainer = document.createElement('div');
    formContainer.className = 'edit-message-form';

    const textarea = document.createElement('textarea');
    textarea.value = message.text;
    textarea.rows = Math.max(3, message.text.split('\n').length);
    textarea.setAttribute('aria-label', 'Editor de mensaje');
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    });

    const actions = document.createElement('div');
    actions.className = 'edit-message-actions';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar y Re-generar';
    saveBtn.className = 'primary-btn';
    saveBtn.onclick = () => handleSaveEdit(textarea.value);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'secondary-btn';
    cancelBtn.onclick = () => handleCancelEdit();

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    formContainer.appendChild(textarea);
    formContainer.appendChild(actions);

    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${message.sender}`;
    messageContainer.appendChild(formContainer);

    chatMessagesDiv.appendChild(messageContainer);
    setTimeout(() => {
        textarea.focus();
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, 0);
}
// --- END Edit & Copy functions ---

// --- START Dynamic Viewport Height ---
function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
// --- END Dynamic Viewport Height ---

// --- START Chat Logic and State Management ---
function handleNewChat() {
    if (confirm("¿Estás seguro de que quieres reiniciar la conversación? Se borrará el historial para empezar desde cero.")) {
        // 1. Clear state variables
        currentChatSession = null;
        editingMessageId = null;
        isLoading = false;

        // 2. Clear persistent storage
        localStorage.removeItem('alainClientChat');

        // 3. Create the initial welcome message for both session history and UI
        chatSessionMessages = [
            { role: 'model', parts: [{ text: WELCOME_MESSAGE }] }
        ];

        uiMessages = [
            {
                id: `ai-welcome-${Date.now()}`,
                sender: 'ai',
                text: WELCOME_MESSAGE,
                timestamp: new Date()
            }
        ];
        
        // 4. Save the new state to storage
        saveClientChat();

        // 5. Re-render the UI with only the welcome message
        renderMessages();

        // 6. Initialize a new chat session with the API
        initializeChatSession();
        
        // 7. Reset the input field
        if (chatInput) {
            chatInput.value = '';
            handleChatInput();
        }
    }
}


function addMessageToChat(
    sender: 'user' | 'ai' | 'system' | 'error',
    text: string,
    options: { explicitId?: string; } = {}
) {
    const message: Message = {
        id: options.explicitId || `${sender}-${Date.now()}`,
        sender, text, timestamp: new Date()
    };
    uiMessages.push(message);
    renderMessages();
}

function finalizeAIMessage(aiMessage: Message, groundingMetadata?: GroundingMetadata) {
    const aiContent: StoredContent = { role: 'model', parts: [{ text: aiMessage.text }] };
    if (groundingMetadata) aiContent.groundingMetadata = groundingMetadata;
    chatSessionMessages.push(aiContent);
    saveClientChat();
}

async function checkMicrophonePermission() {
    if (!navigator.permissions) return;
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        dictateBtn.disabled = permissionStatus.state === 'denied';
        dictateBtn.title = permissionStatus.state === 'denied' ? 'Permiso de micrófono bloqueado' : 'Iniciar dictado';
        permissionStatus.onchange = () => {
            dictateBtn.disabled = permissionStatus.state === 'denied';
            dictateBtn.title = permissionStatus.state === 'denied' ? 'Permiso de micrófono bloqueado' : 'Iniciar dictado';
        };
    } catch (e) {
        console.error("Could not query microphone permission:", e);
    }
}

function loadAndRenderChat() {
    uiMessages = [];
    chatSessionMessages.forEach(contentItem => {
        const textPart = contentItem.parts.find(p => 'text' in p) as Part | undefined;
        let messageText = textPart?.text ?? '';
        
        const sender = contentItem.role === 'user' ? 'user' : 'ai';
        const message: Message = {
            id: `${sender}-hist-${Date.now()}-${Math.random()}`, sender, text: messageText,
            timestamp: new Date(),
            groundingChunks: (contentItem.groundingMetadata?.groundingChunks ?? [])
                .filter(gc => gc.web?.uri)
                .map(gc => ({ web: { uri: gc.web!.uri!, title: gc.web?.title } }))
        };
        
        const fuentesMatch = message.text.match(fuentesParaImagenesRegex);
        if (fuentesMatch && fuentesMatch[2]) {
            message.externalImageLinks = [];
            const linksBlock = fuentesMatch[2];
            let linkMatch;
            const localLinkRegex = new RegExp(linkRegex.source, linkRegex.flags);
            while ((linkMatch = localLinkRegex.exec(linksBlock)) !== null) {
                message.externalImageLinks.push({ text: linkMatch[1], url: linkMatch[2] });
            }
            message.text = message.text.replace(fuentesParaImagenesRegex, '').trim();
        }

        uiMessages.push(message);
    });

    renderMessages();
    initializeChatSession();
}

async function sendPromptToAI(parts: Part[], userMessageId: string) {
    if (!currentChatSession) {
        addMessageToChat('error', 'Error: No hay una sesión de chat activa.');
        isLoading = false;
        return;
    }
    
    const aiMessageId = `ai-${userMessageId.split('-')[1]}`;
    const aiMessage: Message = { id: aiMessageId, sender: 'ai', text: '...', timestamp: new Date() };
    uiMessages.push(aiMessage);
    renderMessages();

    let fullResponseText = '';
    let groundingMetadata: GroundingMetadata | undefined;

    try {
        const stream = await currentChatSession.sendMessageStream({ message: parts });

        for await (const chunk of stream) {
            fullResponseText += chunk.text;
            if (!groundingMetadata && chunk.candidates?.[0]?.groundingMetadata) {
                 groundingMetadata = chunk.candidates[0].groundingMetadata;
            }
            const aiMessageIndex = uiMessages.findIndex(m => m.id === aiMessageId);
            if (aiMessageIndex !== -1) {
                uiMessages[aiMessageIndex].text = fullResponseText + '█';
                renderMessages();
            }
        }
    } catch (error) {
        console.error("Error sending message to AI:", error);
        let errorMessage = 'Lo siento, ocurrió un error.';
        if (error instanceof Error) errorMessage += `\nDetalle: ${error.message}`;
        const aiMessageIndex = uiMessages.findIndex(m => m.id === aiMessageId);
        if (aiMessageIndex !== -1) {
            uiMessages[aiMessageIndex].text = errorMessage;
            uiMessages[aiMessageIndex].sender = 'error';
        } else {
             addMessageToChat('error', errorMessage);
        }
    } finally {
        isLoading = false;
        const finalAiMessageIndex = uiMessages.findIndex(m => m.id === aiMessageId);
        if (finalAiMessageIndex !== -1) {
            const finalMessage = uiMessages[finalAiMessageIndex];
            finalMessage.text = fullResponseText;

            const fuentesMatch = finalMessage.text.match(fuentesParaImagenesRegex);
            if (fuentesMatch && fuentesMatch[2]) {
                finalMessage.externalImageLinks = [];
                const linksBlock = fuentesMatch[2];
                let linkMatch;
                const localLinkRegex = new RegExp(linkRegex.source, linkRegex.flags);
                while ((linkMatch = localLinkRegex.exec(linksBlock)) !== null) {
                    finalMessage.externalImageLinks.push({ text: linkMatch[1], url: linkMatch[2] });
                }
                finalMessage.text = finalMessage.text.replace(fuentesParaImagenesRegex, '').trim();
            }

            if (groundingMetadata?.groundingChunks) {
                finalMessage.groundingChunks = (groundingMetadata.groundingChunks ?? [])
                    .filter(gc => gc.web?.uri)
                    .map(gc => ({ web: { uri: gc.web!.uri!, title: gc.web?.title } }));
            }
            
            renderMessages();
            finalizeAIMessage(finalMessage, groundingMetadata);
        }
    }
}


async function handleSendMessage() {
    if (isLoading) return;

    const promptText = chatInput.value.trim();
    
    const pdfCommandRegex = /^(genera|crea|descarga|env[íi]a|m[áa]ndame)(me)? un pdf/i;
    if (pdfCommandRegex.test(promptText)) {
        await generatePdfOfLastMessage();
        chatInput.value = '';
        handleChatInput();
        return;
    }

    if (!promptText) return;
    
    isLoading = true;

    const userMessageId = `user-${Date.now()}`;
    const parts: Part[] = [];
    
    if (promptText) {
        parts.push({ text: promptText });
    }
    
    addMessageToChat('user', promptText, { explicitId: userMessageId });
    
    const userContent: StoredContent = { role: 'user', parts: [{ text: promptText }] };
    chatSessionMessages.push(userContent);
    saveClientChat();

    chatInput.value = '';
    handleChatInput();

    await sendPromptToAI(parts, userMessageId);
}

// --- END Chat Logic and State Management ---

function initializeDictation() {
    if (!SpeechRecognition) {
        dictateBtn.style.display = 'none';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-US';

    recognition.onstart = () => {
        isDictating = true;
        dictateBtn.classList.add('active');
        dictateBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        dictateBtn.title = 'Detener dictado';
    };

    recognition.onend = () => {
        isDictating = false;
        dictateBtn.classList.remove('active');
        dictateBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        dictateBtn.title = 'Iniciar dictado por voz';
        handleChatInput();
    };

    recognition.onerror = (event: any) => console.error('Speech recognition error:', event.error);

    let final_transcript = chatInput.value;
    recognition.onresult = (event: any) => {
        let interim_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        chatInput.value = final_transcript + interim_transcript;
        handleChatInput();
    };

    dictateBtn.addEventListener('click', () => {
        if (isDictating) {
            recognition.stop();
        } else {
            final_transcript = chatInput.value ? chatInput.value + ' ' : '';
            recognition.start();
        }
    });
}

function setupEventListeners() {
    sendBtn?.addEventListener('click', handleSendMessage);
    newChatBtn?.addEventListener('click', handleNewChat);
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    chatInput?.addEventListener('input', handleChatInput);
    window.addEventListener('resize', setAppHeight);
}

function initializeChatSession() {
    const apiHistory: Content[] = chatSessionMessages.map(contentItem => ({
        role: contentItem.role,
        parts: [{ text: cleanTextForApiHistory((contentItem.parts[0] as Part).text || '') }]
    })).filter(item => (item.parts[0] as Part)?.text?.trim() !== '');

    currentChatSession = ai.chats.create({
        model: MODEL_NAME,
        history: apiHistory,
        config: {
            systemInstruction: ALAIN_CLIENT_SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }]
        }
    });
}

// --- START App Initialization ---
function initializeApp() {
    setAppHeight();
    loadClientChat();
    loadAndRenderChat();
    setupEventListeners();
    initializeDictation();
    checkMicrophonePermission();
}

initializeApp();
// --- END App Initialization ---
