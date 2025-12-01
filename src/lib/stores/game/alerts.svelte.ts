/**
 * Alerts Store for Uncharted Lands
 *
 * Manages settlement alerts and real-time updates via Socket.IO
 */

/* eslint-disable no-undef */
import { socketStore } from './socket';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
	id: string;
	severity: AlertSeverity;
	title: string;
	message: string;
	timestamp: number;
	settlementId: string;
	actionLabel?: string;
	actionHref?: string;
	dismissed?: boolean;
}

interface AlertsStore {
	settlements: Map<string, Alert[]>;
	dismissedAlerts: Set<string>;
}

// Create reactive state
let state = $state<AlertsStore>({
	settlements: new Map(),
	dismissedAlerts: new Set()
});

// Initialize socket listeners
function initializeListeners() {
	const socket = socketStore.getSocket();
	if (!socket) return;

	// New alert received
	socket.on(
		'settlement-alert',
		(data: {
			settlementId: string;
			alert: {
				id: string;
				severity: AlertSeverity;
				title: string;
				message: string;
				actionLabel?: string;
				actionHref?: string;
			};
			timestamp: number;
		}) => {
			console.log('[ALERTS] New alert:', data);

			const alert: Alert = {
				id: data.alert.id,
				severity: data.alert.severity,
				title: data.alert.title,
				message: data.alert.message,
				timestamp: data.timestamp,
				settlementId: data.settlementId,
				actionLabel: data.alert.actionLabel,
				actionHref: data.alert.actionHref,
				dismissed: false
			};

			// Add to settlement's alerts
			const currentAlerts = state.settlements.get(data.settlementId) || [];
			state.settlements.set(data.settlementId, [...currentAlerts, alert]);

			// Trigger reactivity
			state.settlements = new Map(state.settlements);
		}
	);

	// Alert dismissed
	socket.on(
		'alert-dismissed',
		(data: { settlementId: string; alertId: string; timestamp: number }) => {
			console.log('[ALERTS] Alert dismissed:', data);

			// Mark as dismissed in local state
			state.dismissedAlerts.add(data.alertId);
			state.dismissedAlerts = new Set(state.dismissedAlerts);

			// Update settlement alerts
			const alerts = state.settlements.get(data.settlementId);
			if (alerts) {
				const updatedAlerts = alerts.map((alert) =>
					alert.id === data.alertId ? { ...alert, dismissed: true } : alert
				);
				state.settlements.set(data.settlementId, updatedAlerts);
				state.settlements = new Map(state.settlements);
			}
		}
	);

	// Bulk alert update (e.g., on page load)
	socket.on(
		'settlement-alerts',
		(data: { settlementId: string; alerts: Alert[]; timestamp: number }) => {
			console.log('[ALERTS] Bulk alert update:', data);

			state.settlements.set(data.settlementId, data.alerts);
			state.settlements = new Map(state.settlements);
		}
	);

	// Alert cleared/resolved
	socket.on(
		'alert-cleared',
		(data: { settlementId: string; alertId: string; timestamp: number }) => {
			console.log('[ALERTS] Alert cleared:', data);

			// Remove from settlement alerts
			const alerts = state.settlements.get(data.settlementId);
			if (alerts) {
				const filteredAlerts = alerts.filter((alert) => alert.id !== data.alertId);
				state.settlements.set(data.settlementId, filteredAlerts);
				state.settlements = new Map(state.settlements);
			}
		}
	);
}

// Initialize listeners when socket connects
socketStore.subscribe(($socket) => {
	if ($socket.connectionState === 'connected' && $socket.socket) {
		initializeListeners();
	}
});

// Public API
export const alertsStore = {
	/**
	 * Get all alerts for a settlement
	 */
	getAlerts(settlementId: string): Alert[] {
		return state.settlements.get(settlementId) || [];
	},

	/**
	 * Get active (non-dismissed) alerts for a settlement
	 */
	getActiveAlerts(settlementId: string): Alert[] {
		const alerts = state.settlements.get(settlementId) || [];
		return alerts.filter((alert) => !alert.dismissed);
	},

	/**
	 * Get alerts by severity
	 */
	getAlertsBySeverity(settlementId: string, severity: AlertSeverity): Alert[] {
		const alerts = state.settlements.get(settlementId) || [];
		return alerts.filter((alert) => alert.severity === severity && !alert.dismissed);
	},

	/**
	 * Get count of active alerts by severity
	 */
	getAlertCount(settlementId: string, severity?: AlertSeverity): number {
		const alerts = this.getActiveAlerts(settlementId);
		if (!severity) return alerts.length;
		return alerts.filter((alert) => alert.severity === severity).length;
	},

	/**
	 * Dismiss an alert
	 */
	dismissAlert(settlementId: string, alertId: string) {
		const socket = socketStore.getSocket();
		if (socket) {
			socket.emit('dismiss-alert', { settlementId, alertId });
		}

		// Optimistically update local state
		state.dismissedAlerts.add(alertId);
		state.dismissedAlerts = new Set(state.dismissedAlerts);

		const alerts = state.settlements.get(settlementId);
		if (alerts) {
			const updatedAlerts = alerts.map((alert) =>
				alert.id === alertId ? { ...alert, dismissed: true } : alert
			);
			state.settlements.set(settlementId, updatedAlerts);
			state.settlements = new Map(state.settlements);
		}
	},

	/**
	 * Clear all alerts for a settlement
	 */
	clearSettlementAlerts(settlementId: string) {
		const socket = socketStore.getSocket();
		if (socket) {
			socket.emit('clear-settlement-alerts', { settlementId });
		}

		// Optimistically update local state
		state.settlements.set(settlementId, []);
		state.settlements = new Map(state.settlements);
	},

	/**
	 * Request alerts from server for a settlement
	 */
	requestAlerts(settlementId: string) {
		const socket = socketStore.getSocket();
		if (socket) {
			socket.emit('get-settlement-alerts', { settlementId });
		}
	},

	/**
	 * Check if an alert is dismissed
	 */
	isAlertDismissed(alertId: string): boolean {
		return state.dismissedAlerts.has(alertId);
	}
};
