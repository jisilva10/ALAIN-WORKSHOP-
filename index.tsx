import { marked } from "https://esm.sh/marked@^12.0.2";
import DOMPurify from "https://esm.sh/dompurify@^3.0.8";
import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part, GroundingMetadata, Type } from "https://esm.sh/@google/genai@^1.5.1";
import jsPDF from 'https://esm.sh/jspdf@2.5.1';
import html2canvas from 'https://esm.sh/html2canvas@1.4.1';
import emailjs from '@emailjs/browser';

// --- Easily Editable Access Key ---
const ACCESS_KEY = 'PROFEKTUS2025';
const API_KEY = process.env.API_KEY;

// --- EmailJS Configuration ---
const EMAILJS_SERVICE_ID = 'MAIL GABI';
const EMAILJS_TEMPLATE_ID = 'template_dtpxydm';
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

// --- START DOM SELECTORS ---
const chatMessagesDiv = document.getElementById('chat-messages') as HTMLDivElement;
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const mainContentDiv = document.getElementById('main-content') as HTMLDivElement;
const emailBtn = document.getElementById('email-btn') as HTMLButtonElement;
const resetChatTrigger = document.getElementById('reset-chat-trigger');
const resetChatModal = document.getElementById('reset-chat-modal');
const confirmResetBtn = document.getElementById('confirm-reset-btn');
const cancelResetBtn = document.getElementById('cancel-reset-btn');
const emailChatModal = document.getElementById('email-chat-modal');
const confirmEmailBtn = document.getElementById('confirm-email-btn');
const cancelEmailBtn = document.getElementById('cancel-email-btn');
// --- Password Auth Selectors ---
const passwordOverlay = document.getElementById('password-overlay') as HTMLDivElement;
const passwordInput = document.getElementById('password-input') as HTMLInputElement;
const passwordSubmitBtn = document.getElementById('password-submit-btn') as HTMLButtonElement;
const passwordError = document.getElementById('password-error') as HTMLParagraphElement;
const passwordBox = document.getElementById('password-box') as HTMLDivElement;
const appContainer = document.getElementById('app-container') as HTMLDivElement;
const togglePassword = document.getElementById('toggle-password') as HTMLElement;
// --- END DOM SELECTORS ---

// --- START Helper Functions ---
function setAppHeight() {
    // This function sets the app's height based on the browser's inner window height.
    // It's a more reliable way to handle the viewport on mobile devices, especially
    // when the virtual keyboard appears and disappears, compared to pure CSS solutions like '100vh'.
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}

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
            const logoUrl = (document.getElementById('main-logo-img') as HTMLImageElement)?.src;
            if (logoUrl) {
                try {
                    // FIX: Preserve logo aspect ratio (approx 0.7:1) to prevent distortion.
                    pdf.addImage(logoUrl, 'PNG', margin, 5, 14, 20);
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
        emailBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

async function handleSendEmail() {
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        addMessageToChat('error', 'La función de envío de correo no está configurada. Por favor, contacta al administrador.');
        return;
    }

    const messagesToSend = uiMessages.filter(message => message.sender === 'user' || message.sender === 'ai');
    if (messagesToSend.length === 0) {
        addMessageToChat('system', 'No hay ninguna conversación para enviar.');
        return;
    }

    emailBtn.disabled = true;
    emailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    addMessageToChat('system', 'Generando resumen estructurado para enviar...');

    try {
        const conversationForSummary = messagesToSend.map(message => {
            const sender = message.sender === 'user' ? 'Usuario' : 'A’LAIN';
            return `${sender}: "${cleanMarkdownForEmail(message.text)}"`;
        }).join('\n\n');

        const summaryPrompt = `Basado en la siguiente conversación entre un "Usuario" y el asistente "A'LAIN", extrae la siguiente información y devuélvela estrictamente en formato JSON:
1. El nombre y apellido del usuario. Si no se menciona explícitamente, usa el valor "No se especificó el nombre".
2. La fase del taller en la que el usuario menciona estar (ej. "Fase de Ideación"). Si no se menciona, crea un título conciso de 2-4 palabras que resuma el tema principal (ej. "Liderazgo de Equipos").
3. Exactamente tres puntos clave de la conversación. Cada punto debe tener como máximo dos oraciones.
4. Un resumen conciso de la conversación en un solo párrafo.

--- INICIO DE LA CONVERSACIÓN ---
${conversationForSummary}
--- FIN DE LA CONVERSACIÓN ---`;
        
        const summarySchema = {
            type: Type.OBJECT,
            properties: {
                userName: {
                    type: Type.STRING,
                    description: "El nombre y apellido completo del usuario. Si no se encuentra, debe ser 'No se especificó el nombre'.",
                },
                projectPhaseOrTopic: {
                    type: Type.STRING,
                    description: "La fase del taller mencionada por el usuario, o si no se menciona, un título conciso de 2-4 palabras que describa el tema principal de la conversación.",
                },
                keyPoints: {
                    type: Type.ARRAY,
                    description: "Una lista de exactamente tres puntos clave de la conversación. Cada punto debe tener un máximo de dos oraciones.",
                    items: {
                        type: Type.STRING,
                    },
                },
                summary: {
                    type: Type.STRING,
                    description: "Un resumen de la conversación en un solo párrafo.",
                },
            },
            required: ["userName", "projectPhaseOrTopic", "keyPoints", "summary"],
        };

        const summaryResponse = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: summaryPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: summarySchema,
            },
        });

        const summaryJson = JSON.parse(summaryResponse.text.trim());
        
        if (!summaryJson.keyPoints || summaryJson.keyPoints.length === 0) {
             throw new Error("La IA no generó los puntos clave requeridos.");
        }

        const formattedMessage = `
Nombre y Apellido: ${summaryJson.userName}
Tema / Fase: ${summaryJson.projectPhaseOrTopic}
------------------------------------
3 puntos claves:
${summaryJson.keyPoints.map((p: string) => `- ${p}`).join('\n')}
------------------------------------
Resumen de la conversacion:
${summaryJson.summary}
        `.trim();

        const templateParams = {
            to_email: 'jisignacio10@gmail.com',
            subject: `Resumen de Conversación con A'LAIN (${summaryJson.userName} - ${summaryJson.projectPhaseOrTopic})`,
            message: formattedMessage,
        };

        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        addMessageToChat('system', '✅ ¡Resumen de la conversación enviado con éxito a Profektus!');

    } catch (error: any) {
        console.error("Error generating or sending summary email:", error);
        let detailedError = "Ocurrió un error desconocido.";
        try {
            const errJson = JSON.parse(error.message || "{}");
            if (errJson.error && errJson.error.message) {
                detailedError = errJson.error.message;
            } else if (error instanceof Error) {
                detailedError = error.message;
            }
        } catch (e) {
            if (error instanceof Error) {
                detailedError = error.message;
            }
        }
        
        addMessageToChat('error', `El envío del resumen falló. Por favor, intenta de nuevo más tarde. Error: ${detailedError}`);
    } finally {
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

        // Add click listener to toggle action buttons, but not for system/error messages
        if (message.sender === 'user' || message.sender === 'ai') {
            messageBubble.addEventListener('click', (e) => {
                // Don't trigger if a button, link, or other interactive element inside the bubble was clicked.
                if ((e.target as HTMLElement).closest('.message-actions, a, button')) {
                    return;
                }
                
                // Close any other message containers that have actions visible
                document.querySelectorAll('.message-container.actions-visible').forEach(otherContainer => {
                    if (otherContainer !== messageContainer) {
                        otherContainer.classList.remove('actions-visible');
                    }
                });
        
                // Toggle actions on the clicked bubble's container
                messageContainer.classList.toggle('actions-visible');
            });
        }

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
        
        messageContainer.appendChild(messageBubble);

        if (messageActions.hasChildNodes()) {
            messageContainer.appendChild(messageActions);
        }

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
        alert('No se pudo copiar el texto al portapeles.');
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
            fullResponseText += chunk.text || '';
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

function setupEventListeners() {
    sendBtn?.addEventListener('click', handleSendMessage);
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    chatInput?.addEventListener('input', handleChatInput);

    // --- START: Mobile keyboard & viewport fix ---
    // This block replaces the previous complex/buggy implementation with a more robust
    // and widely compatible method using window.innerHeight.
    
    // Set the height when the app loads and whenever the window is resized (e.g., orientation change).
    window.addEventListener('resize', setAppHeight);

    // When the input is focused, wait for the keyboard to appear, then scroll the chat into view.
    chatInput?.addEventListener('focus', () => {
        setTimeout(() => {
            if (chatMessagesDiv) chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
        }, 250);
    });
    
    // When the input is blurred (keyboard hides), wait for the animation to finish, then resize the app.
    // This is the core fix for the "stuck" input bar.
    chatInput?.addEventListener('blur', () => {
        setTimeout(setAppHeight, 100);
    });
    // --- END: Mobile keyboard & viewport fix ---

    resetChatTrigger?.addEventListener('click', () => {
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

    document.addEventListener('click', (e) => {
        // Hide action buttons if a click occurs outside of a message container.
        if (!(e.target as HTMLElement).closest('.message-container')) {
            document.querySelectorAll('.message-container.actions-visible').forEach(container => {
                container.classList.remove('actions-visible');
            });
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
    setAppHeight(); // Set initial height on load
    loadClientChat();
    loadAndRenderChat();
    setupEventListeners();
    handleChatInput(); // Set initial height for the textarea
}

// --- START Authentication Logic ---

function handlePasswordSubmit() {
    if (passwordSubmitBtn?.disabled) return;

    if (passwordInput.value.trim() === ACCESS_KEY) {
        const modalImage = document.querySelector('#password-box .modal-image');
        if (modalImage) {
            modalImage.classList.add('success');
        }

        if (passwordInput) passwordInput.disabled = true;
        if (passwordSubmitBtn) {
            passwordSubmitBtn.disabled = true;
            passwordSubmitBtn.innerHTML = '<i class="fas fa-check"></i> Entrando...';
        }

        setTimeout(() => {
            if (passwordOverlay) passwordOverlay.classList.add('fade-out');
        }, 600);

        setTimeout(() => {
            if (passwordOverlay) passwordOverlay.style.display = 'none';
            if (appContainer) {
                appContainer.style.display = 'flex';
                appContainer.classList.add('fade-in');
            }
            initializeApp();
        }, 1100); 
    } else {
        if (passwordError) passwordError.classList.remove('hidden');
        if (passwordBox) passwordBox.classList.add('shake');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
        setTimeout(() => {
           if (passwordBox) passwordBox.classList.remove('shake');
           if (passwordError) passwordError.classList.add('hidden');
        }, 2000);
    }
}

function main() {
    // Always show password screen on load
    passwordSubmitBtn?.addEventListener('click', handlePasswordSubmit);
    passwordInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handlePasswordSubmit();
        }
    });

    togglePassword?.addEventListener('click', () => {
        if (passwordInput) {
            // Toggle the type
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the icon
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        }
    });

    if (passwordInput) {
        passwordInput.focus();
    }
}

main();