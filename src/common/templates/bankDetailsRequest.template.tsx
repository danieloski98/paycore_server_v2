import React from 'react';

interface BankDetailsRequestTemplateProps {
  url: string;
  name: string;
  companyName: string;
}

const BankDetailsRequestTemplate: React.FC<BankDetailsRequestTemplateProps> = ({
  url,
  name,
  companyName,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Add Your Bank Account Details</title>
        <style>
          {`
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
            }
            .content {
              text-align: left;
              font-size: 16px;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              padding: 12px 25px;
              margin: 20px 0;
              font-size: 16px;
              color: #ffffff;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #777777;
              margin-top: 20px;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h2>Action Required: Add Your Bank Details</h2>
          </div>
          <div className="content">
            <p>Hello {name},</p>
            <p>
              Your employer, <strong>{companyName}</strong>, is preparing payroll. However, we noticed that you do not have a primary bank account set up in your profile.
            </p>
            <p>
              To ensure that your salary can be processed and paid on time, please add your primary bank account details as soon as possible.
            </p>
            <p style={{ textAlign: 'center' }}>
              <a href={url} className="button" style={{ color: '#ffffff' }}>
                Add Bank Account
              </a>
            </p>
            <p>
              If the button above does not work, copy and paste the following link into your browser:
            </p>
            <p>
              <a href={url}>{url}</a>
            </p>
            <p>Thanks,</p>
            <p>The Paycore Team</p>
          </div>
          <div className="footer">
            <p>
              &copy; {new Date().getFullYear()} Paycore. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default BankDetailsRequestTemplate;
