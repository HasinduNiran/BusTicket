import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const TicketComponent = ({ ticket }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.ticketContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.companyName}>BUS TICKET SYSTEM</Text>
        <Text style={styles.ticketTitle}>PASSENGER TICKET</Text>
      </View>

      {/* Ticket Number */}
      <View style={styles.ticketNumberSection}>
        <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
        <Text style={styles.ticketNumberLabel}>Ticket Number</Text>
      </View>

      {/* Route Information */}
      <View style={styles.routeSection}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeSectionTitle}>Route Information</Text>
        </View>
        <View style={styles.routeDetails}>
          <Text style={styles.routeName}>{ticket.routeId?.routeName || 'N/A'}</Text>
          <Text style={styles.routeNumber}>Route: {ticket.routeId?.routeNumber || 'N/A'}</Text>
          <Text style={styles.direction}>
            Direction: {ticket.direction === 'forward' ? '→' : '←'} {ticket.direction?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Journey Details */}
      <View style={styles.journeySection}>
        <View style={styles.journeyRow}>
          <View style={styles.journeyColumn}>
            <Text style={styles.journeyLabel}>FROM</Text>
            <Text style={styles.stopName}>{ticket.fromStop?.stopName}</Text>
            <Text style={styles.sectionInfo}>Section {ticket.fromStop?.sectionNumber}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={styles.journeyColumn}>
            <Text style={styles.journeyLabel}>TO</Text>
            <Text style={styles.stopName}>{ticket.toStop?.stopName}</Text>
            <Text style={styles.sectionInfo}>Section {ticket.toStop?.sectionNumber}</Text>
          </View>
        </View>
      </View>

      {/* Bus & Fare Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Bus Number</Text>
            <Text style={styles.detailValue}>{ticket.busNumber}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Passengers</Text>
            <Text style={styles.detailValue}>{ticket.passengerCount}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>{ticket.paymentMethod?.toUpperCase()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sections</Text>
            <Text style={styles.detailValue}>
              {Math.abs((ticket.toStop?.sectionNumber || 0) - (ticket.fromStop?.sectionNumber || 0))}
            </Text>
          </View>
        </View>
      </View>

      {/* Fare Section */}
      <View style={styles.fareSection}>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>TOTAL FARE</Text>
          <Text style={styles.fareAmount}>{formatCurrency(ticket.fare)}</Text>
        </View>
      </View>

      {/* Issue Details */}
      <View style={styles.issueSection}>
        <View style={styles.issueRow}>
          <View style={styles.issueColumn}>
            <Text style={styles.issueLabel}>Issue Date</Text>
            <Text style={styles.issueValue}>{formatDate(ticket.issueDate)}</Text>
          </View>
          <View style={styles.issueColumn}>
            <Text style={styles.issueLabel}>Conductor</Text>
            <Text style={styles.issueValue}>{ticket.conductorId?.username || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Please keep this ticket during your journey</Text>
        <Text style={styles.footerText}>Thank you for traveling with us!</Text>
        {ticket.qrCode && (
          <View style={styles.qrSection}>
            <Text style={styles.qrLabel}>QR Code: {ticket.qrCode}</Text>
          </View>
        )}
      </View>

      {/* Dotted line for tearing */}
      <View style={styles.tearLine}>
        <Text style={styles.tearText}>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxWidth: width - 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    letterSpacing: 1,
  },
  ticketTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ticketNumberSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  ticketNumberLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  routeSection: {
    marginBottom: 15,
  },
  routeHeader: {
    marginBottom: 8,
  },
  routeSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeDetails: {
    paddingLeft: 5,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  routeNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  direction: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  journeySection: {
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journeyColumn: {
    flex: 1,
    alignItems: 'center',
  },
  arrowContainer: {
    paddingHorizontal: 10,
  },
  arrow: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  journeyLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  sectionInfo: {
    fontSize: 10,
    color: '#999',
  },
  detailsSection: {
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    paddingVertical: 4,
    paddingHorizontal: 5,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  fareSection: {
    marginBottom: 15,
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  issueSection: {
    marginBottom: 15,
  },
  issueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  issueColumn: {
    flex: 1,
  },
  issueLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  issueValue: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  qrSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 8,
    color: '#999',
    fontFamily: 'monospace',
  },
  tearLine: {
    marginTop: 10,
    alignItems: 'center',
  },
  tearText: {
    color: '#ccc',
    fontSize: 8,
  },
});

export default TicketComponent;