import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

class TicketPrintService {
  // Generate HTML for ticket printing
  generateTicketHTML(ticket) {
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

    const sectionsCount = Math.abs((ticket.toStop?.sectionNumber || 0) - (ticket.fromStop?.sectionNumber || 0));

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Bus Ticket - ${ticket.ticketNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .ticket {
          background: white;
          border: 2px solid #2196F3;
          border-radius: 8px;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2196F3;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          color: #2196F3;
          letter-spacing: 1px;
          margin: 0;
        }
        .ticket-title {
          font-size: 14px;
          color: #666;
          margin: 5px 0 0 0;
        }
        .ticket-number-section {
          text-align: center;
          margin-bottom: 15px;
        }
        .ticket-number {
          font-size: 20px;
          font-weight: bold;
          color: #333;
          margin: 0;
        }
        .ticket-number-label {
          font-size: 10px;
          color: #999;
          margin: 2px 0 0 0;
        }
        .section-title {
          font-size: 12px;
          font-weight: 600;
          color: #2196F3;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }
        .route-details {
          padding-left: 5px;
          margin-bottom: 15px;
        }
        .route-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 2px 0;
        }
        .route-number {
          font-size: 12px;
          color: #666;
          margin: 0 0 2px 0;
        }
        .direction {
          font-size: 12px;
          color: #4CAF50;
          font-weight: 600;
          margin: 0;
        }
        .journey-section {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 15px;
        }
        .journey-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .journey-column {
          flex: 1;
          text-align: center;
        }
        .journey-label {
          font-size: 10px;
          color: #666;
          font-weight: 600;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }
        .stop-name {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin: 0 0 2px 0;
        }
        .section-info {
          font-size: 10px;
          color: #999;
          margin: 0;
        }
        .arrow {
          font-size: 20px;
          color: #2196F3;
          font-weight: bold;
          padding: 0 10px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }
        .detail-item {
          padding: 4px 5px;
        }
        .detail-label {
          font-size: 10px;
          color: #666;
          margin: 0 0 2px 0;
        }
        .detail-value {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        .fare-section {
          background: #e8f5e8;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #4CAF50;
          margin-bottom: 15px;
        }
        .fare-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fare-label {
          font-size: 14px;
          font-weight: 600;
          color: #4CAF50;
          margin: 0;
        }
        .fare-amount {
          font-size: 18px;
          font-weight: bold;
          color: #2E7D32;
          margin: 0;
        }
        .issue-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .issue-column {
          flex: 1;
        }
        .issue-label {
          font-size: 10px;
          color: #666;
          margin: 0 0 2px 0;
        }
        .issue-value {
          font-size: 11px;
          color: #333;
          font-weight: 500;
          margin: 0;
        }
        .footer {
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #e0e0e0;
        }
        .footer-text {
          font-size: 10px;
          color: #666;
          margin: 0 0 2px 0;
        }
        .qr-section {
          margin-top: 8px;
        }
        .qr-label {
          font-size: 8px;
          color: #999;
          margin: 0;
        }
        .tear-line {
          text-align: center;
          margin-top: 10px;
        }
        .tear-text {
          color: #ccc;
          font-size: 8px;
          margin: 0;
        }
        @media print {
          body { background-color: white; }
          .ticket { box-shadow: none; border: 1px solid #000; }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <!-- Header -->
        <div class="header">
          <h1 class="company-name">BUS TICKET SYSTEM</h1>
          <p class="ticket-title">PASSENGER TICKET</p>
        </div>

        <!-- Ticket Number -->
        <div class="ticket-number-section">
          <p class="ticket-number">${ticket.ticketNumber}</p>
          <p class="ticket-number-label">Ticket Number</p>
        </div>

        <!-- Route Information -->
        <div class="route-section">
          <p class="section-title">Route Information</p>
          <div class="route-details">
            <p class="route-name">${ticket.routeId?.routeName || 'N/A'}</p>
            <p class="route-number">Route: ${ticket.routeId?.routeNumber || 'N/A'}</p>
            <p class="direction">Direction: ${ticket.direction === 'forward' ? '→' : '←'} ${ticket.direction?.toUpperCase()}</p>
          </div>
        </div>

        <!-- Journey Details -->
        <div class="journey-section">
          <div class="journey-row">
            <div class="journey-column">
              <p class="journey-label">FROM</p>
              <p class="stop-name">${ticket.fromStop?.stopName}</p>
              <p class="section-info">Section ${ticket.fromStop?.sectionNumber}</p>
            </div>
            <div class="arrow">→</div>
            <div class="journey-column">
              <p class="journey-label">TO</p>
              <p class="stop-name">${ticket.toStop?.stopName}</p>
              <p class="section-info">Section ${ticket.toStop?.sectionNumber}</p>
            </div>
          </div>
        </div>

        <!-- Bus & Fare Details -->
        <div class="details-section">
          <div class="details-grid">
            <div class="detail-item">
              <p class="detail-label">Bus Number</p>
              <p class="detail-value">${ticket.busNumber}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Passengers</p>
              <p class="detail-value">${ticket.passengerCount}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Payment</p>
              <p class="detail-value">${ticket.paymentMethod?.toUpperCase()}</p>
            </div>
            <div class="detail-item">
              <p class="detail-label">Sections</p>
              <p class="detail-value">${sectionsCount}</p>
            </div>
          </div>
        </div>

        <!-- Fare Section -->
        <div class="fare-section">
          <div class="fare-row">
            <p class="fare-label">TOTAL FARE</p>
            <p class="fare-amount">${formatCurrency(ticket.fare)}</p>
          </div>
        </div>

        <!-- Issue Details -->
        <div class="issue-section">
          <div class="issue-row">
            <div class="issue-column">
              <p class="issue-label">Issue Date</p>
              <p class="issue-value">${formatDate(ticket.issueDate)}</p>
            </div>
            <div class="issue-column">
              <p class="issue-label">Conductor</p>
              <p class="issue-value">${ticket.conductorId?.username || 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">Please keep this ticket during your journey</p>
          <p class="footer-text">Thank you for traveling with us!</p>
          ${ticket.qrCode ? `
            <div class="qr-section">
              <p class="qr-label">QR Code: ${ticket.qrCode}</p>
            </div>
          ` : ''}
        </div>

        <!-- Dotted line for tearing -->
        <div class="tear-line">
          <p class="tear-text">- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Print ticket
  async printTicket(ticket) {
    try {
      const html = this.generateTicketHTML(ticket);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      console.log('Ticket printed to:', uri);
      
      // Show print dialog
      await Print.printAsync({
        html,
        printerUrl: uri,
      });

      return { success: true, uri };
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'Failed to print ticket. Please try again.');
      return { success: false, error: error.message };
    }
  }

  // Save ticket as PDF and share
  async downloadAndShareTicket(ticket) {
    try {
      const html = this.generateTicketHTML(ticket);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Create a filename with ticket number and date
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Ticket_${ticket.ticketNumber}_${timestamp}.pdf`;
      
      // Copy to downloads directory
      const downloadsDir = `${FileSystem.documentDirectory}downloads/`;
      await FileSystem.makeDirectoryAsync(downloadsDir, { intermediates: true });
      
      const newUri = `${downloadsDir}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Ticket',
          UTI: 'com.adobe.pdf',
        });
      }

      console.log('Ticket saved to:', newUri);
      
      Alert.alert(
        'Ticket Saved',
        `Ticket has been saved as ${filename} and is ready to share.`,
        [{ text: 'OK' }]
      );

      return { success: true, uri: newUri, filename };
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Error', 'Failed to save ticket. Please try again.');
      return { success: false, error: error.message };
    }
  }

  // Save ticket to device storage
  async saveTicketToStorage(ticket) {
    try {
      const html = this.generateTicketHTML(ticket);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Create filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `BusTicket_${ticket.ticketNumber}_${timestamp}.pdf`;
      
      // Save to app's document directory
      const savedUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: uri,
        to: savedUri,
      });

      console.log('Ticket saved locally to:', savedUri);
      
      return { success: true, uri: savedUri, filename };
    } catch (error) {
      console.error('Save error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get saved tickets list
  async getSavedTickets() {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const ticketFiles = files.filter(file => file.startsWith('BusTicket_') && file.endsWith('.pdf'));
      
      const ticketsInfo = await Promise.all(
        ticketFiles.map(async (filename) => {
          const uri = `${FileSystem.documentDirectory}${filename}`;
          const info = await FileSystem.getInfoAsync(uri);
          return {
            filename,
            uri,
            size: info.size,
            modificationTime: info.modificationTime,
          };
        })
      );

      return ticketsInfo.sort((a, b) => b.modificationTime - a.modificationTime);
    } catch (error) {
      console.error('Error getting saved tickets:', error);
      return [];
    }
  }

  // Delete saved ticket
  async deleteSavedTicket(uri) {
    try {
      await FileSystem.deleteAsync(uri);
      return { success: true };
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new TicketPrintService();