import React from 'react';

interface PayslipFailedEmailProps {
  adminName: string;
  companyName: string;
  employeeName: string;
  reason: string;
  payslipId: string;
}

const PayslipFailedTemplate: React.FC<PayslipFailedEmailProps> = ({
  adminName,
  companyName,
  employeeName,
  reason,
  payslipId,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payslip Processing Failed</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', padding: '20px', margin: 0 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid #eeeeee' }}>
            <h2 style={{ color: '#d9534f', margin: 0 }}>Payslip Processing Failed</h2>
          </div>
          <div style={{ padding: '20px 0', fontSize: '15px', lineHeight: '1.6', color: '#333333' }}>
            <p>Hello {adminName},</p>
            <p>
              The payslip processing for <strong>{employeeName}</strong> at <strong>{companyName}</strong> failed.
            </p>
            <div style={{ backgroundColor: '#fdf2f2', borderLeft: '4px solid #d9534f', padding: '12px 16px', margin: '16px 0' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#b94a48' }}>Reason for Failure:</p>
              <p style={{ margin: '4px 0 0 0', color: '#333333' }}>{reason}</p>
            </div>
            <p><strong>Payslip ID:</strong> {payslipId}</p>
            <p>
              Please address the issue and restart the payslip processing from your dashboard once resolved.
            </p>
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#777777', borderTop: '1px solid #eeeeee', paddingTop: '16px' }}>
            <p style={{ margin: 0 }}>Paycore System Notification</p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default PayslipFailedTemplate;
