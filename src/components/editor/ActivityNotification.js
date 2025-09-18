// src/components/editor/ActivityNotification.js
import React, { useState, useEffect } from "react";
import "./ActivityNotification.css";
import { useUML } from "../../context/UMLcontext";

const ActivityNotification = () => {
	const [notifications, setNotifications] = useState([]);
	const [processedEvents, setProcessedEvents] = useState(new Set());
	const { socket, connected, currentUser } = useUML();

	useEffect(() => {
		if (!socket || !connected) return;

		console.log("🟡 Configurando escuchas en ActivityNotification");

		// Función para añadir notificaciones con deduplicación mejorada
		const addNotification = (msg, eventId = null) => {
			console.log("🟡 Añadiendo notificación:", msg);

			// Crear ID único para el evento basado en el contenido
			const uniqueEventId =
				eventId || `${msg.type}-${msg.username}-${msg.message}-${Date.now()}`;

			// Verificar duplicados por contenido Y tiempo
			const isDuplicate = notifications.some(
				n =>
					n.message === msg.message &&
					n.username === msg.username &&
					n.type === msg.type &&
					Date.now() - n.timestamp < 5000 // 5 segundos
			);

			if (isDuplicate) {
				console.log("🟡 Notificación duplicada detectada, saltando");
				return;
			}

			// Verificar si ya procesamos este evento exacto
			if (processedEvents.has(uniqueEventId)) {
				console.log("🟡 Evento exacto ya procesado, saltando:", uniqueEventId);
				return;
			}

			// Verificar si ya procesamos este evento exacto
			if (processedEvents.has(uniqueEventId)) {
				console.log("🟡 Evento exacto ya procesado, saltando:", uniqueEventId);
				return;
			}

			// Marcar evento como procesado
			setProcessedEvents(prev => new Set([...prev, uniqueEventId]));

			const newNotification = {
				id: uniqueEventId,
				type: msg.type || "info",
				message: msg.message,
				timestamp: Date.now(),
				username: msg.username || "Sistema",
			};

			setNotifications(prev => {
				// Verificar si ya existe una notificación idéntica
				const exists = prev.some(
					n =>
						n.message === newNotification.message &&
						n.username === newNotification.username &&
						n.type === newNotification.type &&
						Date.now() - n.timestamp < 3000 // Dentro de 3 segundos
				);

				if (exists) {
					console.log("🟡 Notificación idéntica ya existe, saltando");
					return prev;
				}

				console.log("🟡 Agregando nueva notificación:", newNotification);
				return [newNotification, ...prev].slice(0, 5);
			});

			// Auto eliminar después de 6 segundos
			setTimeout(() => {
				setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
				setProcessedEvents(prev => {
					const newSet = new Set(prev);
					newSet.delete(uniqueEventId);
					return newSet;
				});
			}, 6000);
		};

		// Notificación de prueba para verificar que el componente funciona
		setTimeout(() => {
			addNotification({
				type: "info",
				message: "Sistema de notificaciones activado",
				username: "Sistema",
			});
		}, 2000);

		// Nota: Eliminé las funciones de element-interaction para evitar duplicados
		// Solo usamos uml-updated que es más preciso y menos frecuente

		const handleElementAdded = data => {
			console.log("🟡 Evento element-added recibido:", data);
			console.log("🟡 currentUser.id:", currentUser?.id);
			console.log("🟡 data.userId:", data.userId);

			// No mostrar notificación para el usuario actual
			if (data.userId === currentUser?.id) {
				console.log(
					"🟡 Saltando notificación de elemento agregado del usuario actual"
				);
				return;
			}

			addNotification(
				{
					type: "success",
					message: `agregó un elemento`,
					username: data.username || "Usuario",
				},
				`element-added-${data.element?._id || data.userId}-${Math.floor(
					Date.now() / 1000
				)}`
			);
		};

		const handleElementUpdated = data => {
			console.log("🟡 Evento element-updated recibido:", data);
			console.log("🟡 currentUser.id:", currentUser?.id);
			console.log("🟡 data.userId:", data.userId);

			// No mostrar notificación para el usuario actual
			if (data.userId === currentUser?.id) {
				console.log(
					"🟡 Saltando notificación de elemento actualizado del usuario actual"
				);
				return;
			}

			addNotification(
				{
					type: "info",
					message: `modificó un elemento`,
					username: data.username || "Usuario",
				},
				`element-updated-${data.element?._id || data.userId}-${Math.floor(
					Date.now() / 1000
				)}`
			);
		};

		const handleElementDeleted = data => {
			console.log("🟡 Evento element-deleted recibido:", data);
			console.log("🟡 currentUser.id:", currentUser?.id);
			console.log("🟡 data.userId:", data.userId);

			// No mostrar notificación para el usuario actual
			if (data.userId === currentUser?.id) {
				console.log(
					"🟡 Saltando notificación de elemento eliminado del usuario actual"
				);
				return;
			}

			addNotification(
				{
					type: "delete",
					message: `eliminó un elemento`,
					username: data.username || "Usuario",
				},
				`element-deleted-${data.elementId || data.userId}-${Math.floor(
					Date.now() / 1000
				)}`
			);
		};

		const handleConnectionAdded = data => {
			console.log("🟡 Evento connection-added recibido:", data);
			console.log("🟡 currentUser.id:", currentUser?.id);
			console.log("🟡 data.userId:", data.userId);

			// No mostrar notificación para el usuario actual
			if (data.userId === currentUser?.id) {
				console.log(
					"🟡 Saltando notificación de conexión agregada del usuario actual"
				);
				return;
			}

			addNotification(
				{
					type: "success",
					message: `creó una conexión`,
					username: data.username || "Usuario",
				},
				`connection-added-${data.connection?._id || data.userId}-${Math.floor(
					Date.now() / 1000
				)}`
			);
		};

		const handleConnectionDeleted = data => {
			console.log("🟡 Evento connection-deleted recibido:", data);
			console.log("🟡 currentUser.id:", currentUser?.id);
			console.log("🟡 data.userId:", data.userId);

			// No mostrar notificación para el usuario actual
			if (data.userId === currentUser?.id) {
				console.log(
					"🟡 Saltando notificación de conexión eliminada del usuario actual"
				);
				return;
			}

			addNotification(
				{
					type: "delete",
					message: `eliminó una conexión`,
					username: data.username || "Usuario",
				},
				`connection-deleted-${data.connectionId || data.userId}-${Math.floor(
					Date.now() / 1000
				)}`
			);
		};

		const handleUserJoined = data => {
			console.log("🟡 Evento user-joined recibido:", data);
			console.log("🟡 currentUser.id:", currentUser?.id);
			console.log("🟡 data.userId:", data.userId);

			// No mostrar notificación para el usuario actual
			if (data.userId === currentUser?.id) {
				console.log(
					"🟡 Saltando notificación de usuario unido del usuario actual"
				);
				return;
			}

			addNotification(
				{
					type: "info",
					message: `se unió al proyecto`,
					username: data.user?.name || "Usuario",
				},
				`user-joined-${data.userId}-${Math.floor(Date.now() / 1000)}`
			);
		};

		// Escuchar evento principal uml-updated
		const handleUMLUpdate = data => {
			console.log(
				"🟡 Evento uml-updated recibido en ActivityNotification:",
				data
			);
			console.log("🟡 Tipo de evento:", data.type);
			console.log("🟡 Usuario del evento:", data.username);
			console.log("🟡 ID del usuario del evento:", data.userId);
			console.log("🟡 Usuario actual:", currentUser?.id);

			switch (data.type) {
				case "element-added":
					console.log("🟡 Procesando element-added");
					handleElementAdded(data);
					break;
				case "element-updated":
					console.log("🟡 Procesando element-updated");
					handleElementUpdated(data);
					break;
				case "element-deleted":
					console.log("🟡 Procesando element-deleted");
					handleElementDeleted(data);
					break;
				case "connection-added":
					console.log("🟡 Procesando connection-added");
					handleConnectionAdded(data);
					break;
				case "connection-updated":
					console.log("🟡 Procesando connection-updated");
					handleConnectionAdded(data); // Usar la misma función para conexiones actualizadas
					break;
				case "connection-deleted":
					console.log("🟡 Procesando connection-deleted");
					handleConnectionDeleted(data);
					break;
				case "user-joined":
					console.log("🟡 Procesando user-joined");
					handleUserJoined(data);
					break;
				default:
					console.log("🟡 Tipo de evento no manejado:", data.type);
			}
		};

		// Registrar los escuchas - Solo uml-updated para evitar duplicados
		socket.on("uml-updated", handleUMLUpdate);

		return () => {
			socket.off("uml-updated", handleUMLUpdate);
		};
	}, [socket, connected, currentUser]);

	// Para verificar si hay notificaciones
	useEffect(() => {
		console.log("🟡 Notificaciones actuales:", notifications);
	}, [notifications]);

	if (notifications.length === 0) return null;

	const getNotificationStyle = type => {
		const baseStyle = {
			color: "white",
			padding: "12px 16px",
			borderRadius: "8px",
			boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
			maxWidth: "320px",
			fontSize: "14px",
			fontWeight: "500",
			display: "flex",
			alignItems: "center",
			gap: "8px",
			animation: "slideInRight 0.3s ease-out",
		};

		switch (type) {
			case "delete":
				return { ...baseStyle, backgroundColor: "#F44336" };
			case "success":
				return { ...baseStyle, backgroundColor: "#4CAF50" };
			case "interaction":
				return { ...baseStyle, backgroundColor: "#2196F3" };
			case "info":
			default:
				return { ...baseStyle, backgroundColor: "#333" };
		}
	};

	const getIcon = type => {
		switch (type) {
			case "delete":
				return "🗑️";
			case "success":
				return "✅";
			case "interaction":
				return "👆";
			case "info":
			default:
				return "ℹ️";
		}
	};

	return (
		<div
			className="activity-notifications"
			style={{
				position: "fixed",
				top: "80px",
				right: "20px",
				zIndex: 1000,
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				maxWidth: "350px",
			}}>
			{notifications.map(notification => (
				<div
					key={notification.id}
					style={getNotificationStyle(notification.type)}
					className="notification-item"
					data-type={notification.type}>
					<span style={{ fontSize: "16px", flexShrink: 0 }}>
						{getIcon(notification.type)}
					</span>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								fontWeight: "600",
								marginBottom: "2px",
								fontSize: "13px",
								color: "rgba(255,255,255,0.95)",
							}}>
							{notification.username}
						</div>
						<div
							style={{
								fontSize: "12px",
								opacity: 0.9,
								lineHeight: "1.3",
							}}>
							{notification.message}
						</div>
					</div>
					<button
						onClick={() => {
							setNotifications(prev =>
								prev.filter(n => n.id !== notification.id)
							);
							setProcessedEvents(prev => {
								const newSet = new Set(prev);
								newSet.delete(notification.id);
								return newSet;
							});
						}}
						style={{
							background: "none",
							border: "none",
							color: "rgba(255,255,255,0.7)",
							cursor: "pointer",
							fontSize: "14px",
							padding: "0",
							marginLeft: "8px",
							flexShrink: 0,
							width: "20px",
							height: "20px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: "50%",
							transition: "background-color 0.2s",
						}}
						onMouseEnter={e =>
							(e.target.style.backgroundColor = "rgba(255,255,255,0.2)")
						}
						onMouseLeave={e => (e.target.style.backgroundColor = "transparent")}
						title="Cerrar notificación">
						×
					</button>
				</div>
			))}
		</div>
	);
};

export default ActivityNotification;
