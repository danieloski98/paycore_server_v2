import React from 'react';

interface PasswordResetTemplateProps {
  url: string;
  name: string;
}

const PasswordResetTemplate: React.FC<PasswordResetTemplateProps> = ({
  url,
  name,
}) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset</title>
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
            .header img {
              max-width: 150px;
            }
            .content {
              text-align: left;
              font-size: 16px;
              line-height: 1.6;
            }
            .content p {
              margin: 10px 0;
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
            {/* You can add a logo here if you have one */}
            {/* <img src="cid:paycorelogo" alt="Company Logo" /> */}
            <h2>Password Reset Request</h2>
          </div>
          <div className="content">
            <p>Hello {name},</p>
            <p>
              We received a request to reset your password. If you did not make
              this request, please ignore this email.
            </p>
            <p>To reset your password, please click the button below:</p>
            <p style={{ textAlign: 'center' }}>
              <a href={url} className="button">
                Reset Password
              </a>
            </p>
            <p>
              If the button above does not work, copy and paste the following
              link into your browser:
            </p>
            <p>
              <a href={url}>{url}</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>Thanks,</p>
            <p>The Team</p>
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

export default PasswordResetTemplate;
