import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface LeaveEndedEmailProps {
  employeeName?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  type?: string;
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

export const LeaveEndedEmail = ({
  employeeName = 'there',
  companyName = 'your company',
  startDate,
  endDate,
  totalDays,
  type,
  supportEmail = 'support@paycore.com',
  baseUrl = 'http://localhost:8080/public/',
}: LeaveEndedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome back! Your leave has ended</Preview>
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
                color: '#3b82f6',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '30px 0',
              }}
            >
              Welcome Back!
            </Heading>
            <Text style={paragraph}>
              Hello {employeeName},
            </Text>
            <Text style={paragraph}>
              We hope you had a restful break. This is a reminder that your leave with {companyName} has ended, and you are expected to resume work.
            </Text>
            <Text style={paragraph}>
              <strong>Completed Leave Details:</strong>
            </Text>
            <ul style={{ ...paragraph, listStyle: 'disc', paddingLeft: '20px' }}>
              {type && <li>Leave Type: {type}</li>}
              {startDate && <li>Start Date: {startDate}</li>}
              {endDate && <li>End Date: {endDate}</li>}
              {typeof totalDays === 'number' && <li>Total Days: {totalDays}</li>}
            </ul>
            <Text style={paragraph}>
              If you have any questions or concerns, please contact your manager or support at {supportEmail}.
            </Text>
            <hr style={hr} />
            <Text style={{ color: '#8898aa', fontSize: '12px', lineHeight: '16px' }}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default LeaveEndedEmail;
