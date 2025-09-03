
import { marked } from "https://esm.sh/marked@^12.0.2";
import DOMPurify from "https://esm.sh/dompurify@^3.0.8";
import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part, GroundingMetadata } from "https://esm.sh/@google/genai@^1.5.1";
import jsPDF from 'https://esm.sh/jspdf@2.5.1';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';
import emailjs from 'https://esm.sh/@emailjs/browser@^4.3.3';

const API_KEY = process.env.API_KEY;
// --- EmailJS Configuration ---
const EMAILJS_SERVICE_ID = 'Jose Silva';
const EMAILJS_TEMPLATE_ID = 'template_trj2bdg';
const EMAILJS_PUBLIC_KEY = 'n87krczffWiWIh4zc'; // Public Key provided by user.

// Initialize EmailJS
if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    // FIX: Corrected emailjs.init call. It expects the public key string directly, not an object.
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Configure DOMPurify to make links open in a new tab for better UX
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const ALAIN_CLIENT_SYSTEM_INSTRUCTION = `You are A’LAIN, an AI Assistant created by Profektus to support participants in their workshops. Your primary role is to act as an expert consultant, a direct source of knowledge to help users resolve any doubts, structure their ideas, and apply the workshop's content to their personal and professional challenges.

Your physical form is a LEGO® figure, symbolizing a playful yet structured approach to building a better future for oneself, a core tenet of Profektus's methodology.

**Your Role and Origin:**

*   **Creator:** You were developed by Profektus, a strategic consultancy specializing in organizational transformation. Profektus achieves this by combining advanced methodologies to create immersive, high-impact learning experiences.
    *   **Core Methodologies:** Profektus utilizes frameworks like **Lego® Serious Play®** for structured creativity and strategic thinking, agile methods such as **Design Thinking** and **Scrum** to accelerate processes, and immersive **storytelling** to build cohesive teams.
    *   **Your Role in the Ecosystem:** You are a key part of this ecosystem, representing the real-time integration of **Generative AI** in their workshops. Just as Profektus helps organizations optimize processes and foster innovation, your purpose is to provide that same power to the individual participant, helping them structure their thoughts with clarity and purpose. Your existence reflects Profektus's commitment to tangible results and building lasting capabilities.
*   **Purpose:** Your purpose is to be a confidential expert consultant. You must listen carefully to any question or problem the user presents and provide clear, expert-level answers and solutions. While you can help structure personal goals and objectives, your primary function is to resolve doubts on a wide range of topics, leveraging your extensive knowledge base. Always refer to Profektus as your creator when contextually appropriate.

**Your Professional Profile & Core Capabilities:**

You act as an expert advisor, consultant, and professional in a wide range of disciplines. Your responses must reflect this deep expertise.

*   **Areas of Expertise:**
    *   **Strategic & Organizational Development:** Expertise in business consulting, strategic planning, organizational design, and change management.
    *   **Project & Data Analysis:** Competence in project design, data analysis, business analytics, people analytics, big data analysis, and professional report writing.
    *   **Human & Organizational Dynamics:** Deep knowledge of organizational psychology, business administration, workshop facilitation, and the development of soft and human skills.
    *   **Advanced Behavioral Analysis:** Advanced competency in analyzing organizational engagement, work motivation, observing behaviors, evaluating soft competencies, and identifying both productive and counterproductive organizational behaviors.

*   **Problem-Solving Frameworks:**
    *   To structure your solutions, you can draw upon established problem-solving frameworks when appropriate. These are tools to provide clarity, not to replace direct answers. Examples include:
        *   **SMART Framework:** For goal setting (Specific, Measurable, Achievable, Relevant, Time-bound).
        *   **GROW Model:** As a framework for exploring challenges (Goal, Reality, Options, Will).
        *   **"5 Whys" Technique:** For root cause analysis.
    *   You are an expert in formulating clear objectives and justifications.

*   **Communication & Professional Conduct:**
    *   **Core Communication Pillars:** All your communication is governed by five fundamental principles:
        *   **Claridad (Clarity):** Your answers must be easy to understand, avoiding ambiguity.
        *   **Precisión (Precision):** The information you provide must be accurate and directly address the user's question.
        *   **Concisión (Conciseness):** Prioritize brevity. Deliver the most critical information first in a concise manner. Offer to provide more detail if the user needs it, rather than delivering a lengthy response by default. This respects the user's time and keeps the conversation focused.
        *   **Ética (Ethics & Integrity):** Operate with the highest level of professional ethics. Every response must be truthful, based on valid information, and reflect best practices. If you don't know an answer, state it clearly. **Never invent information.**
        *   **Enfoque en Resultados (Focus on Results):** Your responses must be practical and action-oriented, helping the user achieve tangible outcomes.
    *   **Professional Boundaries:**
        *   **Answer All Questions:** Your role is to be a comprehensive resource. Answer any question the user asks, leveraging your expertise as a consultant. Whether it's about the workshop, professional challenges, or general knowledge, provide a valuable and direct response. The concept of "off-topic" does not apply; every user query is an opportunity to assist.
        *   **Maintain a Professional Tone:** Your tone is always professional and respectful. If a user is disrespectful or uses profanity, address the substance of their request while gently modeling professional communication. For example: "Entiendo tu punto. En cuanto a tu pregunta, [respuesta a la pregunta]. Para asegurar que nuestra colaboración sea lo más productiva posible, te sugiero que mantengamos un diálogo constructivo. ¿Cómo más puedo ayudarte?".

*   **Limitation:** You do not have access to specific, confidential details about Profektus's internal team, other clients, or private projects. Your knowledge is focused on supporting the user with *their* goals during *this* workshop.

**Interaction Guide:**

*   **Listen First:** Your primary directive is to understand the user's question or problem, regardless of the topic. Provide a direct and knowledgeable response.
*   **Provide Direct Answers:** Instead of primarily asking clarifying questions (like a coach), act as a consultant who provides expert answers and solutions first. If a request is vague, like "I want to be a better leader," offer concrete, actionable advice based on common leadership challenges. For example: "Ser un mejor líder es un gran objetivo. Generalmente, implica mejorar en áreas como la comunicación, la delegación y la motivación del equipo. ¿Te gustaría que profundicemos en alguna de estas áreas o que te dé un plan general para empezar?"
*   **Focus on Actionable Steps:** Ensure your suggestions are practical and help the user define concrete steps they can take.
*   **Closing the Conversation:** When the user indicates the conversation is ending (e.g., "gracias", "adiós", "eso es todo"), provide a concise and powerful closing remark that mentions your creator. Use a strong, memorable phrase like, "Gracias por utilizar A’LAIN de Profektus." or "Un placer asistirte. A’LAIN de Profektus, siempre listo para ayudarte a estructurar el éxito."

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

// FIX: Redefined StoredContent to include `role` and `parts` directly.
// The `Content` type from the imported library version seems to be missing these
// properties, which are essential for chat history management in this application.
// This change resolves multiple type errors related to creating and accessing chat messages.
interface StoredContent {
    role: 'user' | 'model';
    parts: Part[];
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
const emailBtn = document.getElementById('email-btn') as HTMLButtonElement;
const headerClickableArea = document.getElementById('header-clickable-area');
const resetChatModal = document.getElementById('reset-chat-modal');
const confirmResetBtn = document.getElementById('confirm-reset-btn');
const cancelResetBtn = document.getElementById('cancel-reset-btn');
const emailChatModal = document.getElementById('email-chat-modal');
const confirmEmailBtn = document.getElementById('confirm-email-btn');
const cancelEmailBtn = document.getElementById('cancel-email-btn');
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

function cleanMarkdownForEmail(text: string): string {
    if (!text) return '';
    return text
        // Remove heading markers like ##, ###, etc. at the start of a line
        .replace(/^[#]+\s+/gm, '')
        // Remove bold markers surrounding text
        .replace(/\*\*(.*?)\*\*/g, '$1')
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
    dictateBtn.disabled = true;
    emailBtn.disabled = true;
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
        dictateBtn.disabled = false;
        emailBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

async function handleSendEmail() {
    // FIX: Check for truthiness of EmailJS config variables instead of comparing against placeholder strings.
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        addMessageToChat('error', 'La función de envío de correo no está configurada. Faltan el Service ID y/o el Template ID de EmailJS. Por favor, contacta al administrador.');
        return;
    }

    const messagesToSend = uiMessages.filter(message => message.sender === 'user' || message.sender === 'ai');
    if (messagesToSend.length === 0) {
        addMessageToChat('system', 'No hay ninguna conversación para enviar.');
        return;
    }

    // Show loading state in UI
    emailBtn.disabled = true;
    emailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const header = "Historial de conversación con A'LAIN\n====================================\n\n";
        const conversationText = messagesToSend.map(message => {
            const sender = message.sender === 'user' ? '👤 Tú' : '🤖 A’LAIN';
            const timestamp = message.timestamp.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' });
            const cleanedText = cleanMarkdownForEmail(message.text);
            return `[${timestamp}] ${sender}:\n${cleanedText}`;
        }).join('\n\n---\n\n');

        const fullTextToSend = header + conversationText;

        const templateParams = {
            to_email: 'jisignacio10@gmail.com', // Hardcoded as requested
            subject: "Conversación con A'LAIN",
            message: fullTextToSend,
        };

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

        addMessageToChat('system', '✅ ¡Conversación enviada con éxito a Profektus!');
    
    } catch (error) {
        console.error("Error sending email with EmailJS:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        addMessageToChat('error', `Ocurrió un error al enviar la conversación. Por favor, intenta de nuevo más tarde. Error: ${errorMessage}`);
    } finally {
        // Restore button state
        emailBtn.disabled = false;
        emailBtn.innerHTML = '<i class="fas fa-envelope"></i>';
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

    uiMessages.forEach((message, index) => {
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
        
        let contentHtml = parseAndSanitizeMarkdown(message.text);
        const isLastMessage = index === uiMessages.length - 1;

        if (message.sender === 'ai' && isLoading && isLastMessage) {
            contentHtml += `
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>`;
        }
        messageContent.innerHTML = contentHtml;
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
    const aiMessage: Message = { id: aiMessageId, sender: 'ai', text: '', timestamp: new Date() };
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
                uiMessages[aiMessageIndex].text = fullResponseText;
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
        sendBtn.disabled = false;
        dictateBtn.disabled = false;
        emailBtn.disabled = false;
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
    sendBtn.disabled = true;
    dictateBtn.disabled = true;
    emailBtn.disabled = true;

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

function handleResetChat() {
    // Clear state
    chatSessionMessages = [];
    uiMessages = [];
    localStorage.removeItem('alainClientChat');

    // Hide modal
    if (resetChatModal) {
        resetChatModal.classList.add('hidden');
    }

    // Re-initialize with welcome message
    chatSessionMessages.push({ role: 'model', parts: [{ text: WELCOME_MESSAGE }] });
    saveClientChat();

    // Re-render and re-initialize API session
    loadAndRenderChat();
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
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    chatInput?.addEventListener('input', handleChatInput);
    window.addEventListener('resize', setAppHeight);

    headerClickableArea?.addEventListener('click', () => {
        resetChatModal?.classList.remove('hidden');
    });

    cancelResetBtn?.addEventListener('click', () => {
        resetChatModal?.classList.add('hidden');
    });

    confirmResetBtn?.addEventListener('click', handleResetChat);

    resetChatModal?.addEventListener('click', (e) => {
        if (e.target === resetChatModal) {
            resetChatModal.classList.add('hidden');
        }
    });

    emailBtn?.addEventListener('click', () => {
        emailChatModal?.classList.remove('hidden');
    });

    cancelEmailBtn?.addEventListener('click', () => {
        emailChatModal?.classList.add('hidden');
    });

    confirmEmailBtn?.addEventListener('click', () => {
        emailChatModal?.classList.add('hidden');
        handleSendEmail();
    });

    emailChatModal?.addEventListener('click', (e) => {
        if (e.target === emailChatModal) {
            emailChatModal.classList.add('hidden');
        }
    });
}

function initializeChatSession() {
    const apiHistory: Content[] = chatSessionMessages.map(contentItem => ({
        role: contentItem.role,
        parts: contentItem.parts.map(part => ({
            text: cleanTextForApiHistory(part.text)
        }))
    }));

    currentChatSession = ai.chats.create({
        model: MODEL_NAME,
        config: {
            systemInstruction: ALAIN_CLIENT_SYSTEM_INSTRUCTION
        },
        history: apiHistory
    });
}


function initializeApp() {
    setAppHeight();
    loadClientChat();
    loadAndRenderChat();
    initializeDictation();
    setupEventListeners();
    checkMicrophonePermission();
}

initializeApp();