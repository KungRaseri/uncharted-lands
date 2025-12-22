/**
 * Game Loop Performance Monitor (Phase 2)
 * 
 * Tracks and analyzes game loop performance metrics:
 * - Tick processing time
 * - System trigger frequency and timing accuracy
 * - CPU load distribution across the hour
 * - Database query performance
 * - Socket.IO emission rates
 * 
 * Usage:
 *   import { GameLoopMonitor } from './game-loop-monitor';
 *   const monitor = GameLoopMonitor.getInstance();
 *   
 *   // In game loop:
 *   monitor.recordTick(currentTick, startTime, endTime);
 *   monitor.recordSystemTrigger('resources', timestamp);
 *   
 *   // Get statistics:
 *   const stats = monitor.getStats();
 *   const report = monitor.generateReport();
 */

import { logger } from './logger.js';

export interface TickMetrics {
    tickNumber: number;
    timestamp: number;
    duration: number; // milliseconds
    systemsTriggered: string[];
}

export interface SystemTrigger {
    system: 'resources' | 'population' | 'repairs' | 'disasters';
    timestamp: number;
    tickNumber: number;
    expectedTime?: number; // Expected timestamp for comparison
    deviation?: number; // Milliseconds off from expected
}

export interface GameLoopStats {
    uptime: number; // seconds
    totalTicks: number;
    averageTickDuration: number; // milliseconds
    maxTickDuration: number; // milliseconds
    minTickDuration: number; // milliseconds
    ticksOver16ms: number; // Ticks that took longer than 16.67ms
    ticksOver50ms: number; // Severely slow ticks

    systemTriggers: {
        resources: number;
        population: number;
        repairs: number;
        disasters: number;
    };

    timingAccuracy: {
        resources: { avg: number; max: number }; // Average/max deviation in ms
        population: { avg: number; max: number };
        repairs: { avg: number; max: number };
        disasters: { avg: number; max: number };
    };

    loadDistribution: {
        ':00-:15': number; // Tick count in this window
        ':15-:30': number;
        ':30-:45': number;
        ':45-:00': number;
    };
}

export class GameLoopMonitor {
    private static instance: GameLoopMonitor;

    private startTime: number;
    private tickMetrics: TickMetrics[] = [];
    private systemTriggers: SystemTrigger[] = [];
    private maxStoredTicks = 3600; // Store last hour of ticks (at 60Hz)
    private maxStoredTriggers = 1000;

    // Real-time counters
    private totalTicks = 0;
    private totalTickDuration = 0;
    private slowTicks16 = 0;
    private slowTicks50 = 0;
    private maxTickDuration = 0;
    private minTickDuration = Infinity;

    private triggerCounts = {
        resources: 0,
        population: 0,
        repairs: 0,
        disasters: 0,
    };

    private triggerDeviations = {
        resources: [] as number[],
        population: [] as number[],
        repairs: [] as number[],
        disasters: [] as number[],
    };

    private constructor() {
        this.startTime = Date.now();
        logger.info('[MONITOR] Game Loop Monitor initialized');
    }

    public static getInstance(): GameLoopMonitor {
        if (!GameLoopMonitor.instance) {
            GameLoopMonitor.instance = new GameLoopMonitor();
        }
        return GameLoopMonitor.instance;
    }

    /**
     * Record a completed tick
     */
    public recordTick(tickNumber: number, startTime: number, endTime: number, systemsTriggered: string[] = []): void {
        const duration = endTime - startTime;

        // Update counters
        this.totalTicks++;
        this.totalTickDuration += duration;

        if (duration > 16.67) this.slowTicks16++;
        if (duration > 50) this.slowTicks50++;
        if (duration > this.maxTickDuration) this.maxTickDuration = duration;
        if (duration < this.minTickDuration) this.minTickDuration = duration;

        // Store tick metrics (rolling window)
        const metrics: TickMetrics = {
            tickNumber,
            timestamp: startTime,
            duration,
            systemsTriggered,
        };

        this.tickMetrics.push(metrics);
        if (this.tickMetrics.length > this.maxStoredTicks) {
            this.tickMetrics.shift();
        }

        // Log slow ticks
        if (duration > 50) {
            logger.warn('[MONITOR] Slow tick detected', {
                tickNumber,
                durationMs: duration,
                systemsTriggered,
                thresholdMs: 50,
            });
        }
    }

    /**
     * Record a system trigger (resources, population, repairs, disasters)
     */
    public recordSystemTrigger(
        system: 'resources' | 'population' | 'repairs' | 'disasters',
        timestamp: number,
        tickNumber: number
    ): void {
        // Calculate expected timestamp
        const expectedTime = this.calculateExpectedTriggerTime(system, timestamp);
        const deviation = expectedTime !== null ? timestamp - expectedTime : 0;

        // Update counters
        this.triggerCounts[system]++;
        if (deviation !== 0) {
            this.triggerDeviations[system].push(Math.abs(deviation));
        }

        // Store trigger
        const trigger: SystemTrigger = {
            system,
            timestamp,
            tickNumber,
            expectedTime: expectedTime ?? undefined,
            deviation,
        };

        this.systemTriggers.push(trigger);
        if (this.systemTriggers.length > this.maxStoredTriggers) {
            this.systemTriggers.shift();
        }

        // Log significant deviations
        if (Math.abs(deviation) > 1000) { // More than 1 second off
            logger.warn('[MONITOR] System trigger timing deviation', {
                system,
                deviation: `${(deviation / 1000).toFixed(2)}s`,
                expected: new Date(expectedTime || 0).toISOString(),
                actual: new Date(timestamp).toISOString(),
            });
        }
    }

    /**
     * Calculate when a system should have triggered
     */
    private calculateExpectedTriggerTime(system: string, actualTime: number): number | null {
        const secondsSinceEpoch = Math.floor(actualTime / 1000);
        const secondsIntoHour = secondsSinceEpoch % 3600;

        switch (system) {
            case 'resources':
                // Should trigger at :00
                return actualTime - (secondsIntoHour * 1000);

            case 'population':
                // Should trigger at :30
                if (secondsIntoHour < 1800) {
                    return actualTime - (secondsIntoHour * 1000) + (1800 * 1000);
                } else {
                    return actualTime - ((secondsIntoHour - 1800) * 1000);
                }

            case 'repairs':
                // Should trigger at :45
                if (secondsIntoHour < 2700) {
                    return actualTime - (secondsIntoHour * 1000) + (2700 * 1000);
                } else {
                    return actualTime - ((secondsIntoHour - 2700) * 1000);
                }

            case 'disasters':
                {
                    // Should trigger every 15 minutes
                    const secondsSinceLastDisaster = secondsSinceEpoch % 900;
                    return actualTime - (secondsSinceLastDisaster * 1000);
                }

            default:
                return null;
        }
    }

    /**
     * Get current statistics
     */
    public getStats(): GameLoopStats {
        const uptime = (Date.now() - this.startTime) / 1000;

        // Calculate load distribution
        const loadDistribution = this.calculateLoadDistribution();

        // Calculate timing accuracy
        const timingAccuracy = {
            resources: this.calculateAccuracyStats('resources'),
            population: this.calculateAccuracyStats('population'),
            repairs: this.calculateAccuracyStats('repairs'),
            disasters: this.calculateAccuracyStats('disasters'),
        };

        return {
            uptime,
            totalTicks: this.totalTicks,
            averageTickDuration: this.totalTicks > 0 ? this.totalTickDuration / this.totalTicks : 0,
            maxTickDuration: this.maxTickDuration,
            minTickDuration: this.minTickDuration === Infinity ? 0 : this.minTickDuration,
            ticksOver16ms: this.slowTicks16,
            ticksOver50ms: this.slowTicks50,
            systemTriggers: { ...this.triggerCounts },
            timingAccuracy,
            loadDistribution,
        };
    }

    /**
     * Calculate accuracy statistics for a system
     */
    private calculateAccuracyStats(system: 'resources' | 'population' | 'repairs' | 'disasters'): { avg: number; max: number } {
        const deviations = this.triggerDeviations[system];

        if (deviations.length === 0) {
            return { avg: 0, max: 0 };
        }

        const avg = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
        const max = Math.max(...deviations);

        return { avg, max };
    }

    /**
     * Calculate load distribution across the hour
     */
    private calculateLoadDistribution(): { ':00-:15': number; ':15-:30': number; ':30-:45': number; ':45-:00': number } {
        const distribution = {
            ':00-:15': 0,
            ':15-:30': 0,
            ':30-:45': 0,
            ':45-:00': 0,
        };

        for (const tick of this.tickMetrics) {
            const secondsSinceEpoch = Math.floor(tick.timestamp / 1000);
            const secondsIntoHour = secondsSinceEpoch % 3600;

            if (secondsIntoHour < 900) distribution[':00-:15']++;
            else if (secondsIntoHour < 1800) distribution[':15-:30']++;
            else if (secondsIntoHour < 2700) distribution[':30-:45']++;
            else distribution[':45-:00']++;
        }

        return distribution;
    }

    /**
     * Generate a detailed performance report
     */
    public generateReport(): string {
        const stats = this.getStats();

        const report: string[] = [];
        report.push('═'.repeat(80));
        report.push('  Game Loop Performance Report');
        report.push('═'.repeat(80));
        report.push(`  Uptime: ${this.formatDuration(stats.uptime)}`);
        report.push(`  Total Ticks: ${stats.totalTicks.toLocaleString()}`);
        report.push('');

        report.push('  Tick Performance:');
        report.push(`    Average Duration: ${stats.averageTickDuration.toFixed(2)}ms`);
        report.push(`    Min Duration: ${stats.minTickDuration.toFixed(2)}ms`);
        report.push(`    Max Duration: ${stats.maxTickDuration.toFixed(2)}ms`);
        report.push(`    Ticks > 16.67ms: ${stats.ticksOver16ms} (${((stats.ticksOver16ms / stats.totalTicks) * 100).toFixed(2)}%)`);
        report.push(`    Ticks > 50ms: ${stats.ticksOver50ms} (${((stats.ticksOver50ms / stats.totalTicks) * 100).toFixed(2)}%)`);
        report.push('');

        report.push('  System Triggers:');
        report.push(`    Resources: ${stats.systemTriggers.resources} (expected: ${Math.floor(stats.uptime / 3600)} per hour)`);
        report.push(`    Population: ${stats.systemTriggers.population} (expected: ${Math.floor(stats.uptime / 3600)} per hour)`);
        report.push(`    Repairs: ${stats.systemTriggers.repairs} (expected: ${Math.floor(stats.uptime / 3600)} per hour)`);
        report.push(`    Disasters: ${stats.systemTriggers.disasters} (expected: ${Math.floor(stats.uptime / 900)} per 15min)`);
        report.push('');

        report.push('  Timing Accuracy (deviation from expected):');
        report.push(`    Resources: avg ${stats.timingAccuracy.resources.avg.toFixed(0)}ms, max ${stats.timingAccuracy.resources.max.toFixed(0)}ms`);
        report.push(`    Population: avg ${stats.timingAccuracy.population.avg.toFixed(0)}ms, max ${stats.timingAccuracy.population.max.toFixed(0)}ms`);
        report.push(`    Repairs: avg ${stats.timingAccuracy.repairs.avg.toFixed(0)}ms, max ${stats.timingAccuracy.repairs.max.toFixed(0)}ms`);
        report.push(`    Disasters: avg ${stats.timingAccuracy.disasters.avg.toFixed(0)}ms, max ${stats.timingAccuracy.disasters.max.toFixed(0)}ms`);
        report.push('');

        report.push('  Load Distribution (ticks per 15-minute window):');
        const totalLoadTicks = Object.values(stats.loadDistribution).reduce((sum, count) => sum + count, 0);
        report.push(`    :00-:15 → ${stats.loadDistribution[':00-:15']} (${((stats.loadDistribution[':00-:15'] / totalLoadTicks) * 100).toFixed(1)}%)`);
        report.push(`    :15-:30 → ${stats.loadDistribution[':15-:30']} (${((stats.loadDistribution[':15-:30'] / totalLoadTicks) * 100).toFixed(1)}%)`);
        report.push(`    :30-:45 → ${stats.loadDistribution[':30-:45']} (${((stats.loadDistribution[':30-:45'] / totalLoadTicks) * 100).toFixed(1)}%)`);
        report.push(`    :45-:00 → ${stats.loadDistribution[':45-:00']} (${((stats.loadDistribution[':45-:00'] / totalLoadTicks) * 100).toFixed(1)}%)`);
        report.push('═'.repeat(80));

        return report.join('\n');
    }

    /**
     * Format duration in seconds to human-readable string
     */
    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    }

    /**
     * Log a periodic report (call this every N minutes)
     */
    public logPeriodicReport(): void {
        logger.info('[MONITOR] Performance Report:\n' + this.generateReport());
    }

    /**
     * Reset all statistics
     */
    public reset(): void {
        this.startTime = Date.now();
        this.tickMetrics = [];
        this.systemTriggers = [];
        this.totalTicks = 0;
        this.totalTickDuration = 0;
        this.slowTicks16 = 0;
        this.slowTicks50 = 0;
        this.maxTickDuration = 0;
        this.minTickDuration = Infinity;
        this.triggerCounts = { resources: 0, population: 0, repairs: 0, disasters: 0 };
        this.triggerDeviations = { resources: [], population: [], repairs: [], disasters: [] };

        logger.info('[MONITOR] Statistics reset');
    }

    /**
     * Get the last N ticks for analysis
     */
    public getRecentTicks(count: number = 100): TickMetrics[] {
        return this.tickMetrics.slice(-count);
    }

    /**
     * Get recent system triggers
     */
    public getRecentTriggers(count: number = 50): SystemTrigger[] {
        return this.systemTriggers.slice(-count);
    }
}
