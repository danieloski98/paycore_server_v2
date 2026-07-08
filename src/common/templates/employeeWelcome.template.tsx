import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface EmployeeWelcomeEmailProps {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  loginUrl?: string;
  supportEmail?: string;
  baseUrl?: string;
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const box = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

export const EmployeeWelcomeEmail = ({
  firstName = 'there',
  lastName = '',
  companyName = 'your company',
  loginUrl = 'https://paycore.com/login',
  supportEmail = 'support@paycore.com',
  baseUrl = 'http://localhost:8080/public/',
}: EmployeeWelcomeEmailProps) => {
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <Html>
      <Head />
      <Preview>
        Welcome to {companyName} - Your Employee Portal is Ready!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={box}>
            <Img
              src={`${baseUrl}/assets/paycorelogo.png`}
              width="150"
              height="40"
              alt="Paycore"
              style={{ margin: '0 auto' }}
            />
            <hr style={hr} />
            <Heading
              style={{
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '30px 0',
              }}
            >
              Welcome to {companyName}, {fullName}!
            </Heading>
            <Text style={paragraph}>
              We're excited to have you join our team! Your employee portal is
              now set up and ready for you to access. Through this portal,
              you'll be able to manage your payroll information, view your
              payslips, and stay connected with your workplace.
            </Text>
            <Text style={paragraph}>
              Here's what you can do in your employee portal:
            </Text>
            <ul
              style={{ ...paragraph, listStyle: 'disc', paddingLeft: '20px' }}
            >
              <li>View and download your monthly payslips</li>
              <li>Update your personal information</li>
              <li>Access your tax documents</li>
              {/* <li>View your leave balance and request time off</li> */}
              <li>Update your bank account details</li>
            </ul>
            <Text style={paragraph}>
              To get started, click the button below to access your employee
              portal:
            </Text>
            <Button style={button} href={loginUrl}>
              Access Employee Portal
            </Button>
            <Text style={paragraph}>
              For security reasons, please change your password after your first
              login. If you have any questions or need assistance, our HR team
              is here to help. You can reach us at{' '}
              <Link
                href={`mailto:${supportEmail}`}
                style={{ color: '#2563eb' }}
              >
                {supportEmail}
              </Link>
            </Text>
            <Text style={paragraph}>
              We look forward to having you as part of our team!
            </Text>
            <Text style={paragraph}>
              Best regards,
              <br />
              The HR Team at {companyName}
            </Text>
            <hr style={hr} />
            <Text style={footer}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
              <br />
              This email was sent to you because you are now an employee at{' '}
              {companyName}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmployeeWelcomeEmail;
