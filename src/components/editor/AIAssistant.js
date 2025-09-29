// src/components/editor/AIAssistant.js - VERSIÓN ADAPTATIVA COMPLETA
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useUML } from "../../context/UMLcontext";
import "./AIAssistant.css";
import axios from "../../utils/aiAxiosConfig";

const AIAssistant = ({
	isOpen,
	onClose,
	initialInput = "",
	onInputChange,
	context = {},
}) => {
	const [messages, setMessages] = useState([
		{
			role: "assistant",
			content:
				"¡Hola! Soy tu asistente UML especializado. Puedo ayudarte a crear diagramas de clases completos, agregar relaciones entre entidades, y diseñar sistemas de base de datos. \n\n¿Qué diagrama UML te gustaría crear hoy?",
			timestamp: Date.now(),
		},
	]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);
	// Estados para funcionalidad de audio

	const [isRecording, setIsRecording] = useState(false);
	const [isTranscribing, setIsTranscribing] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState(null);
	const [audioChunks, setAudioChunks] = useState([]);
	const [recordingTime, setRecordingTime] = useState(0);
	const [voiceSupported, setVoiceSupported] = useState(false);

	// Estados para funcionalidad de imágenes
	const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
	const [dragActive, setDragActive] = useState(false);
	const [previewImage, setPreviewImage] = useState(null);
	const [imageAnalysisResult, setImageAnalysisResult] = useState(null);

	const [uploadSectionVisible, setUploadSectionVisible] = useState(false);

	const {
		createUMLElement,
		umlElements,
		project,
		currentDiagram,
		updateUMLElement,
		selectElement,
		deleteUMLElement,
		createConnection,
	} = useUML();

	// AGREGAR ESTA REFERENCIA después de las referencias existentes
	const recordingIntervalRef = useRef(null);

	// Función para verificar autenticación sin cerrar sesión automáticamente
	const checkAuthentication = () => {
		const token = localStorage.getItem('token');
		const user = localStorage.getItem('user');
		
		if (!token || !user) {
			return false;
		}
		
		try {
			const userData = JSON.parse(user);
			return userData && userData.id;
		} catch (error) {
			console.error("Error parsing user data:", error);
			return false;
		}
	};

	// Verificar soporte de voz al montar el componente

	useEffect(() => {
		const checkVoiceSupport = () => {
			try {
				// Verificación más segura del soporte de voz
				const hasMediaRecorder = typeof MediaRecorder !== "undefined";
				const hasNavigator = typeof navigator !== "undefined";
				const hasMediaDevices = hasNavigator && navigator.mediaDevices;
				const hasGetUserMedia =
					hasMediaDevices &&
					typeof navigator.mediaDevices.getUserMedia === "function";

				// Verificación adicional de contexto seguro (HTTPS)
				const isSecureContext =
					typeof window !== "undefined" &&
					(window.isSecureContext ||
						window.location.protocol === "https:" ||
						window.location.hostname === "localhost" ||
						window.location.hostname === "127.0.0.1");

				const isSupported =
					hasMediaRecorder && hasGetUserMedia && isSecureContext;

				console.log("🎤 Verificando soporte de voz:", {
					MediaRecorder: hasMediaRecorder,
					Navigator: hasNavigator,
					MediaDevices: hasMediaDevices,
					getUserMedia: hasGetUserMedia,
					SecureContext: isSecureContext,
					finalSupport: isSupported,
				});

				setVoiceSupported(isSupported);

				if (!isSupported) {
					if (!isSecureContext) {
						console.warn("⚠️ Grabación de voz requiere HTTPS o localhost");
					}
					if (!hasMediaRecorder) {
						console.warn("⚠️ MediaRecorder no soportado en este navegador");
					}
					if (!hasGetUserMedia) {
						console.warn("⚠️ getUserMedia no soportado en este navegador");
					}
				}
			} catch (error) {
				console.error("❌ Error verificando soporte de voz:", error);
				setVoiceSupported(false);
			}
		};

		// Ejecutar verificación solo si el componente está montado
		if (isOpen) {
			checkVoiceSupport();
		}
	}, [isOpen]);

	useEffect(() => {
		// Cleanup preview URL cuando el componente se desmonta
		return () => {
			if (previewImage) {
				URL.revokeObjectURL(previewImage);
			}
		};
	}, [previewImage]);

	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	useEffect(() => {
		if (initialInput && initialInput !== input) {
			setInput(initialInput);
			if (onInputChange) {
				onInputChange("");
			}
		}
	}, [initialInput, input, onInputChange]);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleInputChange = e => {
		setInput(e.target.value);
	};

	const handleKeyPress = e => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	// FUNCIONES DE GRABACIÓN DE VOZ
	// REEMPLAZAR las funciones de grabación en AIAssistant.js con estas versiones corregidas:

	const startRecording = async () => {
		if (!voiceSupported) {
			console.error("❌ Grabación de voz no soportada");
			const errorMsg = {
				role: "system",
				content:
					"🎤 ❌ Grabación de voz no disponible en este navegador o contexto.",
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMsg]);
			return;
		}

		// Verificar que no estemos ya grabando
		if (isRecording) {
			console.warn("⚠️ Ya hay una grabación en curso");
			return;
		}

		try {
			console.log("🎤 Iniciando grabación de voz...");

			// Verificación adicional antes de llamar getUserMedia
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("getUserMedia no está disponible");
			}

			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 16000,
				},
			});

			// Verificar que tenemos pistas de audio
			const audioTracks = stream.getAudioTracks();
			if (audioTracks.length === 0) {
				throw new Error("No se encontraron pistas de audio");
			}

			console.log("🎧 Stream de audio obtenido:", {
				tracks: audioTracks.length,
				settings: audioTracks[0].getSettings(),
			});

			// Detectar el mejor tipo MIME soportado
			let mimeType = "audio/webm";
			if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
				mimeType = "audio/webm;codecs=opus";
			} else if (MediaRecorder.isTypeSupported("audio/mp4")) {
				mimeType = "audio/mp4";
			} else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
				mimeType = "audio/ogg;codecs=opus";
			}

			console.log("🎵 Usando tipo MIME:", mimeType);

			const recorder = new MediaRecorder(stream, {
				mimeType: mimeType,
			});

			const chunks = [];

			recorder.ondataavailable = event => {
				console.log("📦 Datos disponibles:", event.data.size, "bytes");
				if (event.data.size > 0) {
					chunks.push(event.data);
				}
			};

			recorder.onstop = async () => {
				console.log("🛑 Grabación detenida, procesando audio...");
				console.log("📊 Total de chunks:", chunks.length);

				if (chunks.length === 0) {
					console.error("❌ No hay datos de audio para procesar");
					const errorMsg = {
						role: "system",
						content: "🎤 ❌ No se capturó audio. Intenta grabar nuevamente.",
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, errorMsg]);
					return;
				}

				const audioBlob = new Blob(chunks, { type: mimeType });
				console.log("📦 Audio blob creado:", {
					size: audioBlob.size,
					type: audioBlob.type,
				});

				// Detener todas las pistas del stream
				stream.getTracks().forEach(track => {
					track.stop();
					console.log("🔇 Pista detenida:", track.kind);
				});

				// Verificar que el blob tiene contenido
				if (audioBlob.size === 0) {
					console.error("❌ Audio blob vacío");
					const errorMsg = {
						role: "system",
						content:
							"🎤 ❌ Audio vacío. Intenta hablar más fuerte o verificar el micrófono.",
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, errorMsg]);
					return;
				}

				// Transcribir el audio
				await transcribeAudio(audioBlob);
			};

			recorder.onerror = event => {
				console.error("❌ Error en MediaRecorder:", event.error);
				stopRecording();

				const errorMsg = {
					role: "system",
					content: `🎤 ❌ Error en grabación: ${
						event.error?.message || "Error desconocido"
					}`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, errorMsg]);
			};

			recorder.onstart = () => {
				console.log("✅ Grabación iniciada correctamente");
			};

			// Configurar estados
			setMediaRecorder(recorder);
			setAudioChunks(chunks);
			setIsRecording(true);
			setRecordingTime(0);

			// Iniciar contador de tiempo
			recordingIntervalRef.current = setInterval(() => {
				setRecordingTime(prev => prev + 1);
			}, 1000);

			// Iniciar grabación con intervalos más largos para mejor compatibilidad
			recorder.start(250); // Capturar chunks cada 250ms
			console.log("✅ MediaRecorder iniciado");
		} catch (error) {
			console.error("❌ Error al acceder al micrófono:", error);

			// Limpiar estados en caso de error
			setIsRecording(false);
			if (recordingIntervalRef.current) {
				clearInterval(recordingIntervalRef.current);
				recordingIntervalRef.current = null;
			}

			let errorMessage = "Error al acceder al micrófono";

			if (error.name === "NotAllowedError") {
				errorMessage =
					"Permisos de micrófono denegados. Por favor, permite el acceso al micrófono y recarga la página.";
			} else if (error.name === "NotFoundError") {
				errorMessage =
					"No se encontró micrófono. Verifica que esté conectado y funcionando.";
			} else if (error.name === "NotReadableError") {
				errorMessage =
					"Micrófono en uso por otra aplicación. Cierra otras apps que usen el micrófono.";
			} else if (error.name === "OverconstrainedError") {
				errorMessage = "Configuración de audio no soportada por tu micrófono.";
			} else if (error.name === "SecurityError") {
				errorMessage =
					"Error de seguridad. Asegúrate de estar en HTTPS o localhost.";
			} else if (error.message.includes("getUserMedia")) {
				errorMessage =
					"Tu navegador no soporta grabación de audio o necesita permisos.";
			}

			const errorMsg = {
				role: "system",
				content: `🎤 ❌ ${errorMessage}`,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMsg]);
		}
	};

	const stopRecording = () => {
		console.log("🛑 Intentando detener grabación...");

		if (mediaRecorder && mediaRecorder.state !== "inactive") {
			console.log("🛑 Deteniendo MediaRecorder...");
			try {
				mediaRecorder.stop();
			} catch (error) {
				console.error("❌ Error al detener MediaRecorder:", error);
			}
		}

		setIsRecording(false);

		if (recordingIntervalRef.current) {
			clearInterval(recordingIntervalRef.current);
			recordingIntervalRef.current = null;
			console.log("⏰ Timer de grabación detenido");
		}
	};

	// FUNCIONES DE MANEJO DE IMÁGENES
	const validateImageFile = file => {
		const allowedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
			"image/gif",
		];
		const maxSize = 25 * 1024 * 1024; // 25MB

		if (!allowedTypes.includes(file.type)) {
			throw new Error("Formato no soportado. Usa JPEG, PNG, WebP o GIF.");
		}

		if (file.size > maxSize) {
			throw new Error("Imagen demasiado grande. Máximo 25MB.");
		}

		return true;
	};

	const handleImageDrop = useCallback(async acceptedFiles => {
		if (acceptedFiles && acceptedFiles.length > 0) {
			const file = acceptedFiles[0];

			try {
				validateImageFile(file);
				await processImageFile(file);
			} catch (error) {
				console.error("❌ Error al procesar imagen:", error);
				const errorMsg = {
					role: "system",
					content: `🖼️ ❌ ${error.message}`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, errorMsg]);
			}
		}
	}, []);

	const handleImageSelect = async event => {
		const file = event.target.files[0];
		if (file) {
			try {
				validateImageFile(file);
				await processImageFile(file);
			} catch (error) {
				console.error("❌ Error al seleccionar imagen:", error);
				const errorMsg = {
					role: "system",
					content: `🖼️ ❌ ${error.message}`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, errorMsg]);
			}
		}
		// Limpiar input para permitir seleccionar el mismo archivo de nuevo
		event.target.value = "";
	};

	const processImageFile = async file => {
		console.log("🖼️ Procesando archivo de imagen:", {
			name: file.name,
			size: file.size,
			type: file.type,
		});

		// Crear preview
		const previewUrl = URL.createObjectURL(file);
		setPreviewImage(previewUrl);

		// Mostrar mensaje de análisis iniciado
		const analysisMessage = {
			role: "system",
			content: `🖼️ Analizando imagen "${file.name}"... Esto puede tomar unos momentos.`,
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, analysisMessage]);

		setIsAnalyzingImage(true);

		try {
			const formData = new FormData();
			formData.append("image", file);

			console.log("📤 Enviando imagen para análisis...");

			const response = await axios.post("/ai/analyze-image", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				timeout: 90000, // 90 segundos para análisis de imagen
				onUploadProgress: progressEvent => {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					console.log(`📤 Progreso de subida: ${percentCompleted}%`);
				},
			});

			console.log("📥 Análisis de imagen recibido:", response.data);

			const {
				success,
				analysis,
				actions,
				message: serverMessage,
			} = response.data;

			if (success && actions && actions.length > 0) {
				console.log(
					`✅ Análisis exitoso: ${actions.length} elementos detectados`
				);

				// Remover mensaje de análisis
				setMessages(prev =>
					prev.filter(msg => !msg.content.includes("Analizando imagen"))
				);

				// Guardar resultado del análisis
				setImageAnalysisResult({ analysis, actions });

				// Mostrar resumen del análisis
				const summaryMessage = {
					role: "assistant",
					content: `🖼️ ✅ Análisis completado!\n\n**Tipo de pantalla:** ${
						analysis?.screenType || "Diseño móvil"
					}\n**Elementos detectados:** ${actions.length}\n**Layout:** ${
						analysis?.mainLayout || "Layout personalizado"
					}\n\n¿Quieres que proceda a recrear este diseño en tu canvas?`,
					timestamp: Date.now(),
					imageAnalysis: true,
				};
				setMessages(prev => [...prev, summaryMessage]);

				// Mostrar botones de acción
				const actionMessage = {
					role: "system",
					content:
						"🎨 Usa los botones de abajo para aplicar el diseño o hacer ajustes.",
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, actionMessage]);
			} else {
				console.warn("⚠️ Análisis fallido o sin elementos:", {
					success,
					serverMessage,
				});

				const noAnalysisMsg = {
					role: "system",
					content: `🖼️ ⚠️ ${
						serverMessage ||
						"No se pudieron detectar elementos en la imagen. Intenta con una imagen más clara o con un diseño más definido."
					}`,
					timestamp: Date.now(),
				};
				setMessages(prev =>
					prev
						.filter(msg => !msg.content.includes("Analizando imagen"))
						.concat(noAnalysisMsg)
				);
			}
		} catch (error) {
			console.error("❌ Error en análisis de imagen:", error);

			let errorMessage = "Error al analizar la imagen";

			// Manejo específico de errores de autenticación
			if (error.isAuthError) {
				errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente.";
			} else if (error.isPermissionError) {
				errorMessage = "No tienes permisos para analizar imágenes.";
			} else if (error.isNetworkError) {
				errorMessage = "Error de conexión. Verifica tu internet y vuelve a intentar.";
			} else if (error.response) {
				const status = error.response.status;
				const serverError =
					error.response.data?.error || error.response.data?.message;

				console.error("🔴 Error del servidor:", { status, error: serverError });

				switch (status) {
					case 400:
						errorMessage =
							serverError || "Imagen no válida o formato no soportado.";
						break;
					case 413:
						errorMessage = "Imagen demasiado grande. Máximo 25MB.";
						break;
					case 429:
						errorMessage =
							"Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.";
						break;
					case 500:
						errorMessage =
							"Error del servidor al analizar la imagen. Intenta nuevamente.";
						break;
					default:
						errorMessage = serverError || `Error del servidor (${status}).`;
				}
			} else if (error.code === "ECONNABORTED") {
				errorMessage =
					"Tiempo de espera agotado. La imagen puede ser muy compleja o la conexión lenta.";
			} else if (error.message.includes("Network")) {
				errorMessage = "Error de conexión. Verifica tu internet.";
			}

			const errorMsg = {
				role: "system",
				content: `🖼️ ❌ ${errorMessage}`,
				timestamp: Date.now(),
			};
			setMessages(prev =>
				prev
					.filter(msg => !msg.content.includes("Analizando imagen"))
					.concat(errorMsg)
			);
		} finally {
			setIsAnalyzingImage(false);
		}
	};

	// Función para aplicar el diseño analizado
	const applyImageDesign = async () => {
		if (!imageAnalysisResult || !imageAnalysisResult.actions) {
			console.error("❌ No hay análisis de imagen para aplicar");
			return;
		}

		const { actions } = imageAnalysisResult;

		setIsExecuting(true);

		const executionMessage = {
			role: "system",
			content: `🎨 Aplicando diseño analizado (${actions.length} elementos)...`,
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, executionMessage]);

		try {
			const results = await executeAIActions(actions);

			const successMessage = {
				role: "system",
				content: `✅ Diseño aplicado exitosamente! Se crearon ${results.successful} de ${results.total} elementos.`,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, successMessage]);

			if (results.errors.length > 0) {
				const errorMessage = {
					role: "system",
					content: `⚠️ Algunos elementos tuvieron errores: ${results.errors
						.slice(0, 2)
						.join(", ")}${results.errors.length > 2 ? "..." : ""}`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, errorMessage]);
			}

			// Limpiar resultado de análisis
			setImageAnalysisResult(null);
			setPreviewImage(null);
		} catch (executionError) {
			console.error("Error aplicando diseño:", executionError);
			const errorMessage = {
				role: "system",
				content: `❌ Error al aplicar el diseño: ${executionError.message}`,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsExecuting(false);
		}
	};

	// Función para cancelar análisis de imagen
	const cancelImageAnalysis = () => {
		setImageAnalysisResult(null);
		if (previewImage) {
			URL.revokeObjectURL(previewImage);
			setPreviewImage(null);
		}

		const cancelMessage = {
			role: "system",
			content: "🖼️ Análisis de imagen cancelado.",
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, cancelMessage]);
	};

	// Drag and drop handlers
	const handleDragEnter = e => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = e => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDragOver = e => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = e => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = [...e.dataTransfer.files];
		if (files && files.length > 0) {
			const imageFiles = files.filter(file => file.type.startsWith("image/"));
			if (imageFiles.length > 0) {
				handleImageDrop(imageFiles);
			} else {
				const errorMsg = {
					role: "system",
					content: "🖼️ ❌ Por favor, arrastra solo archivos de imagen.",
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, errorMsg]);
			}
		}
	};

	// Toggle grabación
	const toggleRecording = () => {
		if (isRecording) {
			stopRecording();
		} else {
			startRecording();
		}
	};

	// Formatear tiempo de grabación
	const formatRecordingTime = seconds => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	// REEMPLAZAR la función transcribeAudio en AIAssistant.js con esta versión mejorada:

	const transcribeAudio = async audioBlob => {
		if (!audioBlob || audioBlob.size === 0) {
			console.error("❌ Audio blob vacío o nulo");
			const errorMsg = {
				role: "system",
				content: "🎤 ❌ No hay audio para transcribir.",
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMsg]);
			return;
		}

		// Verificar tamaño mínimo del audio (al menos 1KB)
		if (audioBlob.size < 1024) {
			console.warn("⚠️ Audio muy pequeño:", audioBlob.size, "bytes");
			const errorMsg = {
				role: "system",
				content:
					"🎤 ⚠️ Audio demasiado corto. Intenta grabar un mensaje más largo.",
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMsg]);
			return;
		}

		setIsTranscribing(true);

		const transcribingMessage = {
			role: "system",
			content: "🎤 Transcribiendo audio...",
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, transcribingMessage]);

		try {
			console.log("📝 Enviando audio para transcripción...", {
				size: audioBlob.size,
				type: audioBlob.type,
			});

			const formData = new FormData();

			// Determinar extensión basada en el tipo MIME
			let filename = "recording.webm";
			if (audioBlob.type.includes("mp4")) {
				filename = "recording.mp4";
			} else if (audioBlob.type.includes("ogg")) {
				filename = "recording.ogg";
			}

			formData.append("audio", audioBlob, filename);

			console.log("📤 Enviando FormData con archivo:", filename);

			const response = await axios.post("/ai/transcribe", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				timeout: 45000, // Aumentar timeout a 45 segundos
				onUploadProgress: progressEvent => {
					const percentCompleted = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total
					);
					console.log(`📤 Progreso de subida: ${percentCompleted}%`);
				},
			});

			console.log("📥 Respuesta de transcripción recibida:", response.data);

			const { transcription, success, message: serverMessage } = response.data;

			if (success && transcription && transcription.trim()) {
				console.log("✅ Transcripción exitosa:", transcription);

				// Remover mensaje de transcribiendo
				setMessages(prev =>
					prev.filter(msg => msg.content !== "🎤 Transcribiendo audio...")
				);

				// Agregar transcripción al input
				setInput(transcription);

				// Mostrar mensaje de confirmación
				const successMessage = {
					role: "system",
					content: `🎤 ✅ Transcripción: "${transcription}"`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, successMessage]);

				// Auto-enviar si la transcripción parece ser un comando de diseño completo
				// REEMPLAZAR esta sección de detección de comandos:
				const lowerTranscription = transcription.toLowerCase();
				const isDesignCommand =
					lowerTranscription.length > 5 && // Reducir de 8 a 5
					(lowerTranscription.includes("crear") ||
						lowerTranscription.includes("diseñar") ||
						lowerTranscription.includes("agregar") ||
						lowerTranscription.includes("botón") ||
						lowerTranscription.includes("boton") ||
						lowerTranscription.includes("card") ||
						lowerTranscription.includes("navbar") ||
						lowerTranscription.includes("app bar") ||
						lowerTranscription.includes("appbar") ||
						lowerTranscription.includes("barra") ||
						lowerTranscription.includes("login") ||
						lowerTranscription.includes("formulario") ||
						lowerTranscription.includes("imagen") ||
						lowerTranscription.includes("texto") ||
						lowerTranscription.includes("navegación") ||
						lowerTranscription.includes("navegacion") ||
						lowerTranscription.includes("tarjeta") ||
						lowerTranscription.includes("campo") ||
						lowerTranscription.includes("header") ||
						lowerTranscription.includes("superior") ||
						lowerTranscription.includes("inferior"));

				if (isDesignCommand) {
					console.log("🚀 Auto-enviando comando de diseño detectado...");
					const autoSendMessage = {
						role: "system",
						content:
							"🤖 Comando de diseño detectado. Enviando automáticamente...",
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, autoSendMessage]);

					setTimeout(() => {
						handleVoiceSubmit(transcription);
					}, 1500);
				} else {
					// Mostrar sugerencia para enviar manualmente
					const suggestionMessage = {
						role: "system",
						content:
							"💡 Transcripción lista. Presiona Enter o el botón enviar para procesar tu solicitud.",
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, suggestionMessage]);
				}
			} else {
				console.warn("⚠️ Transcripción vacía o fallida:", {
					success,
					transcription,
					serverMessage,
				});

				const noTranscriptionMsg = {
					role: "system",
					content: `🎤 ⚠️ ${
						serverMessage ||
						"No se pudo transcribir el audio. Intenta hablar más claro y cerca del micrófono."
					}`,
					timestamp: Date.now(),
				};
				setMessages(prev =>
					prev
						.filter(msg => msg.content !== "🎤 Transcribiendo audio...")
						.concat(noTranscriptionMsg)
				);
			}
		} catch (error) {
			console.error("❌ Error en transcripción:", error);

			let errorMessage = "Error al transcribir el audio";

			// Manejo específico de errores de autenticación
			if (error.isAuthError) {
				errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente.";
			} else if (error.isPermissionError) {
				errorMessage = "No tienes permisos para usar la transcripción de voz.";
			} else if (error.isNetworkError) {
				errorMessage = "Error de conexión. Verifica tu internet y vuelve a intentar.";
			} else if (error.response) {
				const status = error.response.status;
				const serverError =
					error.response.data?.error || error.response.data?.message;

				console.error("🔴 Error del servidor:", { status, error: serverError });

				switch (status) {
					case 400:
						errorMessage =
							serverError ||
							"Formato de audio no válido. Intenta grabar nuevamente.";
						break;
					case 413:
						errorMessage =
							"Audio demasiado largo. Intenta con un mensaje más corto (máximo 10MB).";
						break;
					case 429:
						errorMessage =
							"Demasiadas solicitudes. Espera un momento antes de intentar nuevamente.";
						break;
					case 500:
						errorMessage =
							"Error del servidor al procesar el audio. Intenta nuevamente.";
						break;
					case 503:
						errorMessage =
							"Servicio de transcripción temporalmente no disponible.";
						break;
					default:
						errorMessage =
							serverError ||
							`Error del servidor (${status}). Intenta nuevamente.`;
				}
			} else if (error.code === "ECONNABORTED") {
				errorMessage =
					"Tiempo de espera agotado. El audio puede ser demasiado largo o la conexión lenta.";
			} else if (error.message.includes("Network")) {
				errorMessage = "Problema de conexión. Verifica tu internet.";
			}

			const errorMsg = {
				role: "system",
				content: `🎤 ❌ ${errorMessage}`,
				timestamp: Date.now(),
			};
			setMessages(prev =>
				prev
					.filter(msg => msg.content !== "🎤 Transcribiendo audio...")
					.concat(errorMsg)
			);
		} finally {
			setIsTranscribing(false);
		}
	};

	// Función para manejar envío desde voz
	const handleVoiceSubmit = async transcribedText => {
		if (!transcribedText || !transcribedText.trim()) return;

		const userMessage = {
			role: "user",
			content: transcribedText.trim(),
			timestamp: Date.now(),
			source: "voice", // Marcar que viene de voz
		};

		setMessages(prev => [...prev, userMessage]);
		setInput(""); // Limpiar input
		setIsTyping(true);

		const processingMessage = {
			role: "system",
			content: `🎤 Procesando comando de voz: "${transcribedText}"`,
			timestamp: Date.now(),
		};
		setMessages(prev => [...prev, processingMessage]);

		try {
			const response = await sendMessageToAI([...messages, userMessage]);

			const assistantMessage = {
				role: "assistant",
				content: response.message,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, assistantMessage]);

			// Procesar acciones (mismo flujo que el texto)
			const extractedActions = extractActionsFromResponse(response);

			if (extractedActions.length > 0) {
				setIsExecuting(true);

				const executionMessage = {
					role: "system",
					content: `🚀 Ejecutando ${extractedActions.length} acción(es) desde comando de voz...`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, executionMessage]);

				try {
					const results = await executeAIActions(extractedActions);

					const successMessage = {
						role: "system",
						content: `✅ Se ejecutaron exitosamente ${results.successful} de ${results.total} acciones desde comando de voz.`,
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, successMessage]);

					if (results.errors.length > 0) {
						const errorMessage = {
							role: "system",
							content: `⚠️ Errores: ${results.errors.slice(0, 3).join(", ")}${
								results.errors.length > 3 ? "..." : ""
							}`,
							timestamp: Date.now(),
						};
						setMessages(prev => [...prev, errorMessage]);
					}
				} catch (executionError) {
					console.error("Error ejecutando acciones desde voz:", executionError);
					const errorMessage = {
						role: "system",
						content: `❌ Error al ejecutar las acciones desde voz: ${executionError.message}`,
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, errorMessage]);
				}
			}
		} catch (error) {
			console.error("Error al comunicarse con la IA desde voz:", error);
			
			let errorContent = "Lo siento, tuve un problema procesando tu comando de voz.";
			
			// Manejo específico de errores de autenticación
			if (error.isAuthError) {
				errorContent = "🔐 " + error.message + " Por favor, recarga la página e inicia sesión nuevamente.";
			} else if (error.isNetworkError) {
				errorContent = "🌐 " + error.message;
			} else if (error.isServerError) {
				errorContent = "⚠️ " + error.message;
			} else {
				errorContent += " Error: " + error.message;
			}
			
			const errorMessage = {
				role: "assistant",
				content: errorContent,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsTyping(false);
			setIsExecuting(false);
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();

		if (!input.trim() || isTyping || isExecuting) return;

		const userMessage = {
			role: "user",
			content: input.trim(),
			timestamp: Date.now(),
		};

		setMessages(prev => [...prev, userMessage]);
		setInput("");
		setIsTyping(true);

		try {
			const response = await sendMessageToAI([...messages, userMessage]);

			const assistantMessage = {
				role: "assistant",
				content: response.message,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, assistantMessage]);

			// SISTEMA ADAPTATIVO DE EXTRACCIÓN DE ACCIONES
			console.log("🔍 Analizando respuesta completa:", response);

			const extractedActions = extractActionsFromResponse(response);

			if (extractedActions.length > 0) {
				setIsExecuting(true);

				const executionMessage = {
					role: "system",
					content: `🚀 Ejecutando ${extractedActions.length} acción(es)...`,
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, executionMessage]);

				try {
					const results = await executeAIActions(extractedActions);

					const successMessage = {
						role: "system",
						content: `✅ Se ejecutaron exitosamente ${results.successful} de ${results.total} acciones.`,
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, successMessage]);

					if (results.errors.length > 0) {
						const errorMessage = {
							role: "system",
							content: `⚠️ Errores: ${results.errors.slice(0, 3).join(", ")}${
								results.errors.length > 3 ? "..." : ""
							}`,
							timestamp: Date.now(),
						};
						setMessages(prev => [...prev, errorMessage]);
					}
				} catch (executionError) {
					console.error("Error ejecutando acciones:", executionError);
					const errorMessage = {
						role: "system",
						content: `❌ Error al ejecutar las acciones: ${executionError.message}`,
						timestamp: Date.now(),
					};
					setMessages(prev => [...prev, errorMessage]);
				}
			} else {
				console.log("💡 No se encontraron acciones para ejecutar");
				const infoMessage = {
					role: "system",
					content:
						"💬 Respuesta procesada. No se encontraron elementos para crear.",
					timestamp: Date.now(),
				};
				setMessages(prev => [...prev, infoMessage]);
			}
		} catch (error) {
			console.error("Error al comunicarse con la IA:", error);
			
			let errorContent = "Lo siento, tuve un problema procesando tu solicitud.";
			
			// Manejo específico de errores de autenticación
			if (error.isAuthError) {
				errorContent = "🔐 " + error.message + " Por favor, recarga la página e inicia sesión nuevamente.";
			} else if (error.isNetworkError) {
				errorContent = "🌐 " + error.message;
			} else if (error.isServerError) {
				errorContent = "⚠️ " + error.message;
			} else {
				errorContent += " Error: " + error.message;
			}
			
			const errorMessage = {
				role: "assistant",
				content: errorContent,
				timestamp: Date.now(),
			};
			setMessages(prev => [...prev, errorMessage]);
		} finally {
			setIsTyping(false);
			setIsExecuting(false);
		}
	};

	// FUNCIÓN ADAPTATIVA PARA EXTRAER ACCIONES
	const extractActionsFromResponse = response => {
		console.log("🔍 Extrayendo acciones de respuesta...");
		let actions = [];

		// MÉTODO 1: Acciones directas en response.actions
		if (response.actions && Array.isArray(response.actions)) {
			actions = [...response.actions];
			console.log(
				`✅ Método 1: ${actions.length} acciones encontradas en response.actions`
			);
		}

		// MÉTODO 2: Acciones en response.data.actions
		if (
			actions.length === 0 &&
			response.data &&
			response.data.actions &&
			Array.isArray(response.data.actions)
		) {
			actions = [...response.data.actions];
			console.log(
				`✅ Método 2: ${actions.length} acciones encontradas en response.data.actions`
			);
		}

		// MÉTODO 3: Extraer JSON del contenido de texto
		if (actions.length === 0 && response.message) {
			const jsonMatch = response.message.match(/```json\s*([\s\S]*?)\s*```/);
			if (jsonMatch && jsonMatch[1]) {
				try {
					const jsonPart = jsonMatch[1].trim();
					const parsedJson = JSON.parse(jsonPart);
					if (parsedJson.actions && Array.isArray(parsedJson.actions)) {
						actions = [...parsedJson.actions];
						console.log(
							`✅ Método 3: ${actions.length} acciones extraídas del JSON en mensaje`
						);
					}
				} catch (jsonError) {
					console.warn("⚠️ Error parseando JSON del mensaje:", jsonError);
				}
			}
		}

		// MÉTODO 4: Extraer acciones anidadas y aplanarlas
		if (actions.length > 0) {
			actions = flattenNestedActions(actions);
			console.log(`🔄 Acciones aplanadas: ${actions.length} acciones totales`);
		}

		console.log("📋 Acciones finales extraídas:", actions);
		return actions;
	};

	// FUNCIÓN PARA APLANAR ACCIONES ANIDADAS
	const flattenNestedActions = actions => {
		const flattened = [];

		for (const action of actions) {
			// Agregar la acción principal
			const mainAction = { ...action };

			// Si tiene contenido anidado, procesarlo
			if (action.content && Array.isArray(action.content)) {
				console.log(
					`🔄 Procesando ${action.content.length} elementos anidados en ${action.elementType}`
				);

				// Guardar el contenido anidado y limpiar la acción principal
				const nestedElements = [...action.content];
				delete mainAction.content;

				// Agregar la acción principal primero
				flattened.push(mainAction);

				// Procesar elementos anidados
				for (let i = 0; i < nestedElements.length; i++) {
					const nestedElement = nestedElements[i];

					if (nestedElement.type === "create") {
						// Ajustar posiciones relativas al elemento padre
						const adjustedElement = {
							...nestedElement,
							position: {
								x: (action.position?.x || 0) + (nestedElement.position?.x || 0),
								y: (action.position?.y || 0) + (nestedElement.position?.y || 0),
							},
							size: nestedElement.size || { width: 100, height: 50 },
							styles: nestedElement.styles || {},
							flutterProps: nestedElement.flutterProps || {},
							parentId: mainAction.elementType + "_" + Date.now(), // Referencia al padre
						};

						flattened.push(adjustedElement);
					}
				}
			} else {
				// Acción simple sin anidamiento
				flattened.push(mainAction);
			}
		}

		return flattened;
	};

	const sendMessageToAI = async messageHistory => {
		try {
			console.log("🤖 AI: Enviando mensaje a la IA...");

			if (!currentDiagram) {
				throw new Error("No hay diagrama seleccionado");
			}

			// Verificar autenticación antes de enviar
			if (!checkAuthentication()) {
				throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
			}

			const validElements = Array.isArray(umlElements)
				? umlElements.filter(el => el && el._id && el.type)
				: [];

			const canvasContext = {
				canvas: {
					width: currentDiagram.canvas?.width || 1200,
					height: currentDiagram.canvas?.height || 800,
					deviceType: "UML",
					backgroundColor: currentDiagram.canvas?.background || "#FFFFFF",
				},
				elements: {
					count: validElements.length,
					types: [...new Set(validElements.map(el => el.type))],
					details: validElements.map(el => ({
						id: el._id,
						type: el.type,
						name: el.name,
						content:
							el.content?.substring(0, 50) +
							(el.content?.length > 50 ? "..." : ""),
						position: el.position,
						size: el.size,
						hasAttributes: (el.properties?.attributes || []).length > 0,
						hasOperations: (el.properties?.operations || []).length > 0,
						stereotype: el.properties?.stereotype || "",
						isAbstract: el.properties?.isAbstract || false,
					})),
				},
				availableElements: [
					"class",
					"interface", 
					"abstract_class",
					"enum",
					"package",
					"component",
					"actor",
					"use_case",
					"note"
				],
				availableRelations: [
					"association",
					"inheritance",
					"realization",
					"aggregation",
					"composition",
					"dependency",
					"one-to-one",
					"one-to-many",
					"many-to-one",
					"many-to-many",
					"zero-to-one",
					"zero-to-many",
					"one-or-many",
					"intermediate-table"
				],
				context: {
					diagramId: context.diagramId || currentDiagram._id,
					projectId: context.projectId || project?._id,
					diagramName: context.diagramName || currentDiagram.name,
					diagramType: context.diagramType || 'class',
				},
			};

			const systemPrompt = `Eres un experto en UML (Unified Modeling Language) especializado en crear diagramas de clases, relaciones y estructuras de base de datos.

CONTEXTO DEL PROYECTO UML:
- Canvas: ${canvasContext.canvas.width}x${canvasContext.canvas.height} px
- Elementos actuales: ${canvasContext.elements.count} (${canvasContext.elements.types.join(", ")})
- Tipo de diagrama: ${canvasContext.diagramType || 'class'}

ELEMENTOS UML DISPONIBLES:
- Clases (class)
- Interfaces (interface) 
- Clases abstractas (abstract_class)
- Enumeraciones (enum)
- Paquetes (package)
- Componentes (component)
- Actores (actor)
- Casos de uso (use_case)
- Notas (note)

RELACIONES UML DISPONIBLES:
- Asociación (association)
- Herencia (inheritance)
- Realización (realization)
- Agregación (aggregation)
- Composición (composition)
- Dependencia (dependency)
- Uno a Uno (one-to-one)
- Uno a Muchos (one-to-many)
- Muchos a Uno (many-to-one)
- Muchos a Muchos (many-to-many)
- Cero a Uno (zero-to-one)
- Cero a Muchos (zero-to-many)
- Uno o Muchos (one-or-many)
- Tabla Intermedia (intermediate-table)

ELEMENTOS EXISTENTES:
${canvasContext.elements.details
	.map(
		el =>
			`- ${el.name} (${el.type}): pos(${el.position.x},${el.position.y}) tamaño[${el.size.width}x${el.size.height}]`
	)
	.join("\n") || 'Ninguno'}

IMPORTANTE: Los comandos pueden venir de voz transcrita y pueden tener variaciones gramaticales. Interpreta la intención del usuario incluso si la gramática no es perfecta.

MAPEO DE COMANDOS UML COMUNES (SENSIBLE A VOZ):
- "tabla producto" / "clase producto" / "entidad producto" → crear clase Producto
- "categoría" / "categorias" → crear clase Categoria
- "uno a muchos" / "1:*" / "1 a muchos" → relación one-to-many
- "muchos a muchos" / "*:*" → relación many-to-many
- "hereda de" / "extiende" / "es un" → relación inheritance
- "implementa" / "realiza" → relación realization

INSTRUCCIONES PARA CREAR ELEMENTOS UML:

1. CLASE SIMPLE CON ATRIBUTOS:
\`\`\`json
{
  "actions": [
    {
      "type": "create",
      "elementType": "class",
      "name": "Producto",
      "position": {"x": 100, "y": 100},
      "size": {"width": 200, "height": 150},
      "attributes": [
        {"name": "id", "type": "String", "visibility": "private"},
        {"name": "nombre", "type": "String", "visibility": "private"},
        {"name": "precio", "type": "Number", "visibility": "private"},
        {"name": "descripcion", "type": "String", "visibility": "private"},
        {"name": "categoriaId", "type": "String", "visibility": "private"},
        {"name": "createdAt", "type": "Date", "visibility": "private"},
        {"name": "updatedAt", "type": "Date", "visibility": "private"}
      ],
      "operations": [
        {"name": "getId", "returnType": "String", "visibility": "public"},
        {"name": "setId", "parameters": [{"name": "id", "type": "String"}], "returnType": "void", "visibility": "public"},
        {"name": "getNombre", "returnType": "String", "visibility": "public"},
        {"name": "setNombre", "parameters": [{"name": "nombre", "type": "String"}], "returnType": "void", "visibility": "public"}
      ]
    }
  ]
}
\`\`\`

2. SISTEMA COMPLETO CON RELACIONES:
\`\`\`json
{
  "actions": [
    {
      "type": "create",
      "elementType": "class",
      "name": "Producto",
      "position": {"x": 100, "y": 100},
      "size": {"width": 200, "height": 150},
      "attributes": [
        {"name": "id", "type": "String", "visibility": "private"},
        {"name": "nombre", "type": "String", "visibility": "private"},
        {"name": "precio", "type": "Number", "visibility": "private"},
        {"name": "categoriaId", "type": "String", "visibility": "private"},
        {"name": "createdAt", "type": "Date", "visibility": "private"}
      ],
      "operations": [
        {"name": "getId", "returnType": "String", "visibility": "public"},
        {"name": "getNombre", "returnType": "String", "visibility": "public"},
        {"name": "getPrecio", "returnType": "Number", "visibility": "public"}
      ]
    },
    {
      "type": "create",
      "elementType": "class", 
      "name": "Categoria",
      "position": {"x": 400, "y": 100},
      "size": {"width": 200, "height": 150},
      "attributes": [
        {"name": "id", "type": "String", "visibility": "private"},
        {"name": "nombre", "type": "String", "visibility": "private"},
        {"name": "descripcion", "type": "String", "visibility": "private"},
        {"name": "createdAt", "type": "Date", "visibility": "private"}
      ],
      "operations": [
        {"name": "getId", "returnType": "String", "visibility": "public"},
        {"name": "getNombre", "returnType": "String", "visibility": "public"}
      ]
    },
    {
      "type": "create_connection",
      "connectionType": "one-to-many",
      "sourceElementName": "Categoria",
      "targetElementName": "Producto",
      "properties": {
        "sourceMultiplicity": "1",
        "targetMultiplicity": "*",
        "sourceRole": "categoria",
        "targetRole": "productos"
      }
    }
  ]
}
\`\`\`

3. HERENCIA:
\`\`\`json
{
  "actions": [
    {
      "type": "create",
      "elementType": "abstract_class",
      "name": "Vehiculo",
      "position": {"x": 100, "y": 100},
      "size": {"width": 200, "height": 120},
      "attributes": [
        {"name": "marca", "type": "String", "visibility": "protected"},
        {"name": "modelo", "type": "String", "visibility": "protected"},
        {"name": "año", "type": "Number", "visibility": "protected"}
      ],
      "operations": [
        {"name": "acelerar", "parameters": [], "returnType": "void", "visibility": "public", "isAbstract": true},
        {"name": "frenar", "parameters": [], "returnType": "void", "visibility": "public"}
      ]
    },
    {
      "type": "create",
      "elementType": "class",
      "name": "Auto",
      "position": {"x": 100, "y": 300},
      "size": {"width": 200, "height": 120},
      "attributes": [
        {"name": "numeroPuertas", "type": "Number", "visibility": "private"}
      ],
      "operations": [
        {"name": "acelerar", "parameters": [], "returnType": "void", "visibility": "public"}
      ]
    },
    {
      "type": "create_connection",
      "connectionType": "inheritance",
      "sourceElementName": "Auto",
      "targetElementName": "Vehiculo",
      "properties": {
        "sourceRole": "hijo",
        "targetRole": "padre"
      }
    }
  ]
}
\`\`\`

4. INTERFAZ CON REALIZACIÓN:
\`\`\`json
{
  "actions": [
    {
      "type": "create",
      "elementType": "interface",
      "name": "Pagable",
      "position": {"x": 100, "y": 100},
      "size": {"width": 200, "height": 120},
      "operations": [
        {"name": "procesarPago", "parameters": [{"name": "monto", "type": "Number"}], "returnType": "boolean", "visibility": "public"},
        {"name": "validarTarjeta", "parameters": [{"name": "numero", "type": "String"}], "returnType": "boolean", "visibility": "public"}
      ]
    },
    {
      "type": "create",
      "elementType": "class",
      "name": "PagoTarjeta",
      "position": {"x": 400, "y": 100},
      "size": {"width": 200, "height": 120},
      "attributes": [
        {"name": "numeroTarjeta", "type": "String", "visibility": "private"},
        {"name": "fechaVencimiento", "type": "Date", "visibility": "private"}
      ],
      "operations": [
        {"name": "procesarPago", "parameters": [{"name": "monto", "type": "Number"}], "returnType": "boolean", "visibility": "public"},
        {"name": "validarTarjeta", "parameters": [{"name": "numero", "type": "String"}], "returnType": "boolean", "visibility": "public"}
      ]
    },
    {
      "type": "create_connection",
      "connectionType": "realization",
      "sourceElementName": "PagoTarjeta",
      "targetElementName": "Pagable",
      "properties": {
        "sourceRole": "implementador",
        "targetRole": "interfaz"
      }
    }
  ]
}
\`\`\`

REGLAS IMPORTANTES:
- SIEMPRE incluye el bloque JSON cuando vayas a crear elementos UML
- Ajusta las posiciones para que no se superpongan con elementos existentes
- Para relaciones uno a muchos, el elemento "uno" va a la izquierda
- Agrega automáticamente atributos comunes (id, timestamps)
- Genera métodos getter/setter básicos
- Usa nombres en español pero con convenciones de programación (camelCase)

INTERPRETACIÓN DE COMANDOS DE VOZ:
- "crea una tabla producto con relación uno a muchos con categoría" → 2 clases + relación
- "diseña un sistema de usuarios y roles" → clases User, Role + relaciones
- "modela la herencia entre vehiculo, auto y moto" → 3 clases + herencia
- "agrega una interfaz pagable" → interface + realización

Analiza el mensaje del usuario y proporciona el JSON completo para crear los elementos UML solicitados.`;

			const formattedMessages = [
				{ role: "system", content: systemPrompt },
				...messageHistory.slice(-10).map(msg => ({
					role: msg.role,
					content: msg.content,
				})),
			];

			console.log("📤 Enviando request a /api/ai/chat");

			const response = await axios.post("/ai/chat", {
				messages: formattedMessages,
				context: canvasContext,
			});

			console.log("📥 Respuesta completa recibida:", response.data);

			return {
				actions: response.data.actions || [],
				message: response.data.response || response.data.message || "",
				data: response.data,
			};
		} catch (error) {
			console.error("❌ Error en sendMessageToAI:", error);
			
			// Manejo específico de errores de autenticación
			if (error.response?.status === 401) {
				console.error("🔐 Error de autenticación detectado");
				const authError = new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
				authError.isAuthError = true;
				throw authError;
			}
			
			// Manejo de errores de red
			if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
				const networkError = new Error("Error de conexión. Verifica tu internet y vuelve a intentar.");
				networkError.isNetworkError = true;
				throw networkError;
			}
			
			// Manejo de errores del servidor
			if (error.response) {
				console.error("Response data:", error.response.data);
				console.error("Response status:", error.response.status);
				
				const serverError = new Error(
					error.response?.data?.message ||
					`Error del servidor (${error.response.status})`
				);
				serverError.isServerError = true;
				serverError.status = error.response.status;
				throw serverError;
			}
			
			// Error genérico
			throw new Error(
				error.message ||
				"Error de comunicación con la IA"
			);
		}
	};

	const executeAIActions = async actions => {
		console.log("⚡ Ejecutando acciones UML recibidas:", actions);

		if (!Array.isArray(actions)) {
			console.error("❌ Las acciones no son un array:", actions);
			throw new Error("Formato de acciones inválido");
		}

		let successful = 0;
		let total = actions.length;
		const errors = [];
		const createdElements = [];
		const createdConnections = [];

		// Primero crear todos los elementos, luego las conexiones
		const elementActions = actions.filter(action => action.type === 'create');
		const connectionActions = actions.filter(action => action.type === 'create_connection');

		// Ejecutar creación de elementos
		for (let i = 0; i < elementActions.length; i++) {
			const action = elementActions[i];
			console.log(`🔧 Ejecutando creación de elemento ${i + 1}/${elementActions.length}:`, action);

			try {
				if (!action.elementType) {
					throw new Error("Tipo de elemento requerido para crear");
				}

				console.log("➕ Creando elemento UML:", action.elementType);

				// Validar y ajustar posición dentro del canvas
				const canvasWidth = currentDiagram.canvas?.width || 1200;
				const canvasHeight = currentDiagram.canvas?.height || 800;
				const elementWidth = Math.max(100, action.size?.width || 200);
				const elementHeight = Math.max(80, action.size?.height || 120);

				const elementData = {
					type: action.elementType,
					name: action.name || `${action.elementType} IA`,
					content: action.content || "",
					position: {
						x: Math.max(
							0,
							Math.min(
								canvasWidth - elementWidth,
								action.position?.x || 100 + (i * 300)
							)
						),
						y: Math.max(
							0,
							Math.min(
								canvasHeight - elementHeight,
								action.position?.y || 100
							)
						),
					},
					size: {
						width: elementWidth,
						height: elementHeight,
					},
					// Propiedades específicas UML
					properties: {
						stereotype: action.stereotype || "",
						attributes: action.attributes || [],
						operations: action.operations || [],
						visibility: action.visibility || 'public',
						isAbstract: action.isAbstract || false
					},
					styles: {
						// Estilos por defecto para elementos UML
						backgroundColor: "#FFFFFF",
						borderColor: "#000000",
						borderWidth: 1,
						borderRadius: 4,
						fontSize: 12,
						fontFamily: "Arial, sans-serif",
						textColor: "#000000",
						// Sobrescribir con estilos personalizados
						...(action.styles || {}),
					}
				};

				console.log("📋 Datos del elemento UML a crear:", elementData);

				const createdElement = await createUMLElement(elementData);
				createdElements.push(createdElement);
				console.log("✅ Elemento UML creado exitosamente:", createdElement.name);
				successful++;

				// Pausa entre elementos para estabilidad
				if (i < elementActions.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 200));
				}
			} catch (error) {
				console.error(`❌ Error en creación de elemento ${i + 1}:`, error);
				errors.push(`Elemento ${i + 1}: ${error.message}`);
			}
		}

		// Ahora ejecutar creación de conexiones
		for (let i = 0; i < connectionActions.length; i++) {
			const action = connectionActions[i];
			console.log(`🔗 Ejecutando creación de conexión ${i + 1}/${connectionActions.length}:`, action);

			try {
				if (!action.connectionType) {
					throw new Error("Tipo de conexión requerido");
				}

				// Buscar los elementos por nombre
				const sourceElement = createdElements.find(el => el.name === action.sourceElementName);
				const targetElement = createdElements.find(el => el.name === action.targetElementName);

				if (!sourceElement) {
					throw new Error(`Elemento origen '${action.sourceElementName}' no encontrado`);
				}
				if (!targetElement) {
					throw new Error(`Elemento destino '${action.targetElementName}' no encontrado`);
				}

				console.log("🔗 Creando conexión UML:", action.connectionType, "entre", sourceElement.name, "y", targetElement.name);

				const connectionData = {
					sourceElementId: sourceElement._id,
					targetElementId: targetElement._id,
					type: action.connectionType,
					properties: {
						...action.properties,
						sourceMultiplicity: action.properties?.sourceMultiplicity || "",
						targetMultiplicity: action.properties?.targetMultiplicity || "",
						sourceRole: action.properties?.sourceRole || "",
						targetRole: action.properties?.targetRole || "",
						label: action.properties?.label || ""
					}
				};

				console.log("📋 Datos de la conexión UML a crear:", connectionData);

				const createdConnection = await createConnection(connectionData);
				createdConnections.push(createdConnection);
				console.log("✅ Conexión UML creada exitosamente");
				successful++;

				// Pausa entre conexiones
				if (i < connectionActions.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 300));
				}
			} catch (error) {
				console.error(`❌ Error en creación de conexión ${i + 1}:`, error);
				errors.push(`Conexión ${i + 1}: ${error.message}`);
			}
		}

		// Ejecutar otras acciones (update, select, delete)
		const otherActions = actions.filter(action => 
			!['create', 'create_connection'].includes(action.type)
		);

		for (let i = 0; i < otherActions.length; i++) {
			const action = otherActions[i];
			console.log(`🔧 Ejecutando otra acción ${i + 1}/${otherActions.length}:`, action);

			try {
				switch (action.type) {
					case "update":
						if (!action.elementId) {
							throw new Error("ID de elemento requerido para actualizar");
						}

						const updateData = {};
						if (action.name) updateData.name = action.name;
						if (action.content !== undefined) updateData.content = action.content;
						if (action.position) updateData.position = action.position;
						if (action.size) updateData.size = action.size;
						if (action.styles) updateData.styles = action.styles;
						if (action.properties) updateData.properties = action.properties;

						await updateUMLElement(action.elementId, updateData);
						console.log("✅ Elemento actualizado exitosamente");
						break;

					case "select":
						if (action.elementId) {
							const validElements = Array.isArray(umlElements)
								? umlElements.filter(el => el && el._id && el.type)
								: [];
							const element = validElements.find(el => el._id === action.elementId);
							if (element) {
								selectElement(action.elementId, element);
								console.log("✅ Elemento seleccionado exitosamente");
							}
						}
						break;

					case "delete":
						if (action.elementId) {
							await deleteUMLElement(action.elementId);
							console.log("✅ Elemento eliminado exitosamente");
						}
						break;

					default:
						throw new Error(`Tipo de acción desconocida: ${action.type}`);
				}

				successful++;

				// Pausa entre acciones
				if (i < otherActions.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 150));
				}
			} catch (error) {
				console.error(`❌ Error en otra acción ${i + 1}:`, error);
				errors.push(`Acción ${i + 1}: ${error.message}`);
			}
		}

		if (errors.length > 0) {
			console.warn("⚠️ Errores en ejecución UML:", errors);
		}

		console.log(`📊 Resultado final UML: ${successful}/${total} acciones exitosas`);
		console.log(`🎨 Elementos UML creados: ${createdElements.length}`);
		console.log(`🔗 Conexiones UML creadas: ${createdConnections.length}`);

		return { 
			successful, 
			total, 
			errors, 
			createdElements,
			createdConnections
		};
	};

	const clearChat = () => {
		setMessages([
			{
				role: "assistant",
				content:
					"¡Chat limpio! ¿En qué puedo ayudarte ahora? Puedes escribir, usar el micrófono o subir una imagen de diagrama UML.",
				timestamp: Date.now(),
			},
		]);

		// Limpiar estado de imagen
		if (previewImage) {
			URL.revokeObjectURL(previewImage);
			setPreviewImage(null);
		}
		setImageAnalysisResult(null);
		setDragActive(false);
		setUploadSectionVisible(false); // AGREGAR ESTA LÍNEA
	};

	if (!isOpen) return null;

	return (
		<div className="ai-assistant">
			<div className="ai-assistant-header">
				<div className="header-content">
					<div className="assistant-info">
						<h3>Asistente</h3>
						<span className="status-indicator">
							{isAnalyzingImage
								? "🖼️ Analizando imagen..."
								: isRecording
								? "🎤 Grabando..."
								: isTranscribing
								? "📝 Transcribiendo..."
								: isTyping
								? "✍️ Escribiendo..."
								: isExecuting
								? "⚡ Ejecutando..."
								: ""}
						</span>
					</div>
					<div className="header-actions">
						<button
							className="clear-chat-button"
							onClick={clearChat}
							title="Limpiar chat"
							disabled={
								isTyping ||
								isExecuting ||
								isRecording ||
								isTranscribing ||
								isAnalyzingImage
							}>
							🗑️
						</button>
						<button className="close-button" onClick={onClose}>
							×
						</button>
					</div>
				</div>
			</div>

			<div className="ai-assistant-messages">
				{messages.map((msg, index) => (
					<div key={index} className={`message ${msg.role}`}>
						<div className="message-content">
							{msg.content.split("\n").map((line, i) => (
								<div key={i}>{line}</div>
							))}
							{msg.source === "voice" && (
								<div className="message-badge voice-badge">🎤 Voz</div>
							)}
						</div>
						{msg.timestamp && (
							<div className="message-timestamp">
								{new Date(msg.timestamp).toLocaleTimeString()}
							</div>
						)}
					</div>
				))}
				{isTyping && (
					<div className="message assistant">
						<div className="typing-indicator">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			<div className="ai-assistant-examples">
				<div className="examples-label">Sugerencias:</div>
				<div className="example-buttons">
					{[
						"Crea una tabla producto con relación uno a muchos con categoría",
						"Diseña un sistema de usuarios y roles con herencia",
						"Agrega una clase vehículo con auto y moto que hereden",
						// "Crea una interfaz pagable con implementación",
					].map((example, i) => (
						<button
							key={i}
							className="example-button"
							onClick={() => setInput(example)}
							disabled={
								isTyping ||
								isExecuting ||
								isRecording ||
								isTranscribing ||
								isAnalyzingImage
							}>
							{example}
						</button>
					))}
				</div>
			</div>
			<div className="ai-assistant-image-upload">
				{/* Botón para mostrar/ocultar upload */}
				{/* <button
					className="upload-toggle-button"
					onClick={() => setUploadSectionVisible(!uploadSectionVisible)}
					disabled={isAnalyzingImage}>
					<span>
						{uploadSectionVisible ? "📊 Ocultar" : "🖼️ Analizar Diagrama UML"}
					</span>
					<i
						className={`fa fa-chevron-${
							uploadSectionVisible ? "up" : "down"
						}`}></i>
				</button> */}

				{/* Sección colapsible */}
				<div
					className={`upload-section ${
						uploadSectionVisible ? "expanded" : "collapsed"
					}`}>
					<div className="upload-label">🖼️ Análisis de Diagrama UML:</div>

					{/* ZONA DE DRAG & DROP */}
					<div
						className={`image-drop-zone ${dragActive ? "drag-active" : ""} ${
							isAnalyzingImage ? "analyzing" : ""
						}`}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onDragOver={handleDragOver}
						onDrop={handleDrop}>
						{/* Contenido del drop zone */}
						{isAnalyzingImage ? (
							<div className="analyzing-indicator">
								<div className="analyzing-spinner"></div>
								<span>Analizando imagen...</span>
								<small>Detectando elementos UI</small>
							</div>
						) : previewImage ? (
							<div className="image-preview">
								<img src={previewImage} alt="Preview" />
								<div className="preview-overlay">
									<button
										className="remove-image-btn"
										onClick={() => {
											URL.revokeObjectURL(previewImage);
											setPreviewImage(null);
											setImageAnalysisResult(null);
										}}
										disabled={isAnalyzingImage}>
										✕
									</button>
								</div>
							</div>
						) : (
							<div className="drop-zone-content">
								<div className="drop-icon">📊</div>
								<div className="drop-text">
									<strong>Arrastra una imagen de diagrama UML aquí</strong>
									<span>o haz clic para seleccionar</span>
								</div>
								<div className="drop-formats">
									Soporta: JPG, PNG, WebP, GIF (máx. 25MB)
								</div>
							</div>
						)}

						<input
							type="file"
							accept="image/*"
							onChange={handleImageSelect}
							disabled={isAnalyzingImage}
							style={{ display: "none" }}
							id="image-upload-input"
						/>

						{!isAnalyzingImage && !previewImage && (
							<label htmlFor="image-upload-input" className="upload-overlay">
								Seleccionar imagen
							</label>
						)}
					</div>

					{/* BOTONES DE ACCIÓN - ESTOS DEBEN ESTAR FUERA DEL DROP ZONE */}
					{imageAnalysisResult && (
						<div className="image-actions">
							<button
								className="apply-design-btn"
								onClick={applyImageDesign}
								disabled={isExecuting || isAnalyzingImage}>
								{isExecuting ? (
									<>
										<div className="btn-spinner"></div>
										Aplicando...
									</>
								) : (
									<>
										🎨 Aplicar Diseño ({imageAnalysisResult.actions.length}{" "}
										elementos)
									</>
								)}
							</button>

							<button
								className="cancel-analysis-btn"
								onClick={cancelImageAnalysis}
								disabled={isExecuting || isAnalyzingImage}>
								❌ Cancelar
							</button>
						</div>
					)}

					{/* INFORMACIÓN DEL ANÁLISIS */}
					{imageAnalysisResult?.analysis && (
						<div className="analysis-info">
							<div className="analysis-item">
								<strong>Tipo:</strong> {imageAnalysisResult.analysis.screenType}
							</div>
							<div className="analysis-item">
								<strong>Layout:</strong>{" "}
								{imageAnalysisResult.analysis.mainLayout}
							</div>
							<div className="analysis-item">
								<strong>Elementos:</strong> {imageAnalysisResult.actions.length}
							</div>
						</div>
					)}
				</div>
			</div>
			<form onSubmit={handleSubmit} className="ai-assistant-input">
				<div className="input-container">
					<textarea
						ref={inputRef}
						value={input}
						onChange={handleInputChange}
						onKeyPress={handleKeyPress}
						placeholder="Describe el diagrama UML que quieres crear... Puedes escribir, usar el micrófono o subir una imagen de diagrama. (Presiona Enter para enviar)"
						disabled={
							isTyping ||
							isExecuting ||
							isRecording ||
							isTranscribing ||
							isAnalyzingImage
						}
						rows="2"
					/>

					{/* BOTÓN DE VOZ */}
					{voiceSupported && (
						<button
							type="button"
							className={`voice-button ${isRecording ? "recording" : ""} ${
								isTranscribing ? "transcribing" : ""
							}`}
							onClick={toggleRecording}
							disabled={isTyping || isExecuting || isTranscribing}
							title={
								isRecording ? "Detener grabación" : "Grabar mensaje de voz"
							}>
							{isRecording ? (
								<div className="recording-indicator">
									<i className="fa fa-stop"></i>
									<span className="recording-time">
										{formatRecordingTime(recordingTime)}
									</span>
								</div>
							) : isTranscribing ? (
								<div className="transcribing-indicator">
									<i className="fa fa-spinner fa-spin"></i>
								</div>
							) : (
								<i className="fa fa-microphone"></i>
							)}
						</button>
					)}

					<button
						type="submit"
						disabled={
							isTyping ||
							isExecuting ||
							!input.trim() ||
							isRecording ||
							isTranscribing ||
							isAnalyzingImage
						}
						className="send-button">
						{isTyping || isExecuting ? (
							<div className="sending-spinner"></div>
						) : (
							<i className="fa fa-paper-plane"></i>
						)}
					</button>
				</div>

				{/* INDICADOR DE ESTADO DE VOZ */}
				{isRecording && (
					<div className="voice-status recording">
						<div className="voice-indicator">
							<div className="pulse"></div>
							<i className="fa fa-microphone"></i>
						</div>
						<span>Grabando... ({formatRecordingTime(recordingTime)})</span>
						<span className="voice-hint">Toca el micrófono para detener</span>
					</div>
				)}

				{isTranscribing && (
					<div className="voice-status transcribing">
						<div className="voice-indicator">
							<i className="fa fa-spinner fa-spin"></i>
						</div>
						<span>Transcribiendo audio...</span>
					</div>
				)}

				{!voiceSupported && (
					<div className="voice-status unsupported">
						<i className="fa fa-exclamation-triangle"></i>
						<span>Grabación de voz no disponible en este navegador</span>
					</div>
				)}
			</form>
		</div>
	);
};

export default AIAssistant;
