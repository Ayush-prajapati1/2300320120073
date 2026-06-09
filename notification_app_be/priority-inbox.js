/**
 * Priority Inbox Service
 * Implements a priority inbox that displays the top 'n' most important unread notifications
 * Priority is determined by a combination of weight (placement) and recency
 * 
 * Priority Score Calculation:
 * priority_score = (weight * 0.6) + (recency_score * 0.4)
 * where recency_score is based on how recent the notification is
 */

const fs = require('fs');
const path = require('path');

/**
 * Notification object structure
 * @typedef {Object} Notification
 * @property {number} id - Unique notification ID
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {number} weight - Weight/importance level (1-10)
 * @property {number} timestamp - When the notification was created (unix timestamp)
 * @property {boolean} isRead - Whether the notification has been read
 */

class PriorityInboxService {
  constructor() {
    this.notifications = [];
    this.topNotifications = [];
  }

  /**
   * Load sample notifications
   */
  loadSampleNotifications() {
    const now = Date.now();
    this.notifications = [
      {
        id: 1,
        title: 'Assignment Submission Deadline',
        message: 'Your Data Structures assignment is due tomorrow',
        weight: 9,
        timestamp: now - 3600000, // 1 hour ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 2,
        title: 'Exam Schedule Released',
        message: 'Your fall semester exam schedule has been released',
        weight: 8,
        timestamp: now - 7200000, // 2 hours ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 3,
        title: 'Course Registration Open',
        message: 'Spring semester course registration is now open',
        weight: 7,
        timestamp: now - 10800000, // 3 hours ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 4,
        title: 'Library Book Due',
        message: 'Your library book "Algorithms" is due in 2 days',
        weight: 4,
        timestamp: now - 14400000, // 4 hours ago
        isRead: false,
        category: 'Library'
      },
      {
        id: 5,
        title: 'Campus Event - Tech Talk',
        message: 'Join us for a tech talk on AI and Machine Learning',
        weight: 3,
        timestamp: now - 18000000, // 5 hours ago
        isRead: false,
        category: 'Events'
      },
      {
        id: 6,
        title: 'Grade Posted',
        message: 'Your instructor posted grades for Quiz 1',
        weight: 6,
        timestamp: now - 1800000, // 30 minutes ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 7,
        title: 'Tuition Payment Due',
        message: 'Your tuition payment is due by December 31st',
        weight: 10,
        timestamp: now - 21600000, // 6 hours ago
        isRead: false,
        category: 'Finance'
      },
      {
        id: 8,
        title: 'Campus Maintenance Notice',
        message: 'Building A will be closed for maintenance on Friday',
        weight: 2,
        timestamp: now - 25200000, // 7 hours ago
        isRead: false,
        category: 'Maintenance'
      },
      {
        id: 9,
        title: 'Scholarship Opportunity',
        message: 'New scholarship applications are now being accepted',
        weight: 5,
        timestamp: now - 28800000, // 8 hours ago
        isRead: false,
        category: 'Financial Aid'
      },
      {
        id: 10,
        title: 'Lab Report Submission',
        message: 'Submit your physics lab report by Friday 5 PM',
        weight: 8,
        timestamp: now - 32400000, // 9 hours ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 11,
        title: 'Student Council Elections',
        message: 'Vote for your student council representatives',
        weight: 2,
        timestamp: now - 36000000, // 10 hours ago
        isRead: false,
        category: 'Student Life'
      },
      {
        id: 12,
        title: 'Dean\'s List Achievement',
        message: 'Congratulations! You have made the Dean\'s List',
        weight: 9,
        timestamp: now - 39600000, // 11 hours ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 13,
        title: 'Parking Permit Renewal',
        message: 'Your parking permit expires on December 31st',
        weight: 4,
        timestamp: now - 43200000, // 12 hours ago
        isRead: false,
        category: 'Campus Services'
      },
      {
        id: 14,
        title: 'Course Waitlist Update',
        message: 'You are now enrolled in the waitlisted course',
        weight: 7,
        timestamp: now - 46800000, // 13 hours ago
        isRead: false,
        category: 'Academic'
      },
      {
        id: 15,
        title: 'Internship Fair',
        message: 'Annual internship fair is happening next week',
        weight: 6,
        timestamp: now - 50400000, // 14 hours ago
        isRead: false,
        category: 'Career'
      }
    ];
  }

  /**
   * Calculate recency score based on notification age
   * More recent notifications get higher scores
   * @param {number} timestamp - Notification creation timestamp
   * @returns {number} Recency score (0-10)
   */
  calculateRecencyScore(timestamp) {
    const now = Date.now();
    const ageInMinutes = (now - timestamp) / (1000 * 60);
    
    // Score formula: older notifications get lower scores
    // 0 minutes old = score 10
    // 60 minutes old = score 5
    // 240+ minutes old = score 0
    const maxAgeMinutes = 240;
    const recencyScore = Math.max(0, 10 * (1 - ageInMinutes / maxAgeMinutes));
    
    return recencyScore;
  }

  /**
   * Calculate priority score for a notification
   * priority_score = (weight * 0.6) + (recency_score * 0.4)
   * @param {Notification} notification - The notification object
   * @returns {number} Priority score (0-10)
   */
  calculatePriorityScore(notification) {
    if (notification.isRead) return 0; // Filter out read notifications
    
    const weightComponent = notification.weight * 0.6;
    const recencyComponent = this.calculateRecencyScore(notification.timestamp) * 0.4;
    
    return weightComponent + recencyComponent;
  }

  /**
   * Get top N most important unread notifications
   * @param {number} n - Number of notifications to return (default 10)
   * @returns {Array} Array of top N notifications with their priority scores
   */
  getTopNotifications(n = 10) {
    // Calculate priority score for all unread notifications
    const notificationsWithScores = this.notifications
      .filter(notif => !notif.isRead)
      .map(notif => ({
        ...notif,
        priorityScore: this.calculatePriorityScore(notif)
      }));

    // Sort by priority score in descending order
    const sorted = notificationsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);

    // Get top N notifications
    this.topNotifications = sorted.slice(0, Math.min(n, sorted.length));
    
    return this.topNotifications;
  }

  /**
   * Format notifications for display
   * @param {number} topN - Number of top notifications to display
   * @returns {string} Formatted string for console output
   */
  formatOutput(topN = 10) {
    this.getTopNotifications(topN);
    
    let output = '\n';
    output += '╔════════════════════════════════════════════════════════════════════════════════════╗\n';
    output += '║                        PRIORITY INBOX - TOP 10 NOTIFICATIONS                       ║\n';
    output += '╠════════════════════════════════════════════════════════════════════════════════════╣\n';
    
    this.topNotifications.forEach((notif, index) => {
      const timeAgo = this.getTimeAgoString(notif.timestamp);
      const priorityBar = this.getPriorityBar(notif.priorityScore);
      
      output += `\n[${index + 1}] ${notif.title}\n`;
      output += `    Category: ${notif.category} | Weight: ${notif.weight}/10 | Priority: ${notif.priorityScore.toFixed(2)}/10 ${priorityBar}\n`;
      output += `    Message: ${notif.message}\n`;
      output += `    Received: ${timeAgo}\n`;
      output += `    ─────────────────────────────────────────────────────────────────────────────────\n`;
    });

    output += '╚════════════════════════════════════════════════════════════════════════════════════╝\n';
    output += `\nTotal Unread Notifications: ${this.notifications.filter(n => !n.isRead).length}\n`;
    output += `Displaying: Top ${Math.min(topN, this.topNotifications.length)} of ${this.notifications.filter(n => !n.isRead).length}\n`;
    
    return output;
  }

  /**
   * Get human-readable time ago string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Time ago string
   */
  getTimeAgoString(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  /**
   * Get visual priority bar
   * @param {number} score - Priority score
   * @returns {string} Visual bar representation
   */
  getPriorityBar(score) {
    const filled = Math.round(score);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Display detailed statistics
   */
  displayStatistics() {
    const unreadCount = this.notifications.filter(n => !n.isRead).length;
    const categories = {};
    let totalWeight = 0;

    this.notifications.forEach(notif => {
      if (!notif.isRead) {
        categories[notif.category] = (categories[notif.category] || 0) + 1;
        totalWeight += notif.weight;
      }
    });

    let output = '\n╔════════════════════════════════════════════════════════════════════════════════════╗\n';
    output += '║                           NOTIFICATION STATISTICS                                  ║\n';
    output += '╠════════════════════════════════════════════════════════════════════════════════════╣\n';
    output += `║ Total Unread Notifications: ${unreadCount.toString().padEnd(60)}║\n`;
    output += `║ Average Priority Weight: ${(totalWeight / unreadCount).toFixed(2).toString().padEnd(59)}║\n`;
    output += '║                                                                                    ║\n';
    output += '║ Breakdown by Category:                                                             ║\n';

    Object.entries(categories).forEach(([category, count]) => {
      output += `║   • ${category}: ${count} notification(s)${' '.repeat(Math.max(0, 72 - category.length - count.toString().length))}║\n`;
    });

    output += '╚════════════════════════════════════════════════════════════════════════════════════╝\n';
    return output;
  }
}

// Main execution
if (require.main === module) {
  const inboxService = new PriorityInboxService();
  
  // Load sample notifications
  inboxService.loadSampleNotifications();

  // Display priority inbox
  console.log(inboxService.formatOutput(10));

  // Display statistics
  console.log(inboxService.displayStatistics());

  // Export for testing/integration
  console.log('\n✓ Priority Inbox Service initialized successfully!');
  console.log('✓ Algorithm: (Weight × 0.6) + (Recency × 0.4)');
  console.log('✓ Top 10 notifications are calculated and displayed above.\n');
}

module.exports = PriorityInboxService;
