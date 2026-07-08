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

export interface LeaveStatusEmailProps {
  employeeName?: string;
  companyName?: string;
  status?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  description?: string;
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

export const LeaveStatusEmail = ({
  employeeName = 'there',
  companyName = 'your company',
  status = 'PENDING',
  startDate,
  endDate,
  totalDays,
  description,
  supportEmail = 'support@paycore.com',
  baseUrl = 'http://localhost:8080/public/',
}: LeaveStatusEmailProps) => {
  const statusText =
    status === 'ACCEPTED' ? 'accepted' : status === 'REJECTED' ? 'declined' : 'updated';
  return (
    <Html>
      <Head />
      <Preview>Your leave request was {statusText} by {companyName}</Preview>
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
              Your leave request was {statusText}
            </Heading>
            <Text style={paragraph}>
              Hello {employeeName},
            </Text>
            <Text style={paragraph}>
              Your leave request has been {statusText} by {companyName}.
            </Text>
            <Text style={paragraph}>
              <strong>Leave details</strong>
            </Text>
            <ul style={{ ...paragraph, listStyle: 'disc', paddingLeft: '20px' }}>
              {startDate && <li>Start date: {startDate}</li>}
              {endDate && <li>End date: {endDate}</li>}
              {typeof totalDays === 'number' && <li>Total days: {totalDays}</li>}
              {description && <li>Description: {description}</li>}
              <li>Status: {status}</li>
            </ul>
            <Text style={paragraph}>
              If you have any questions, please contact our support team at {supportEmail}.
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

export default LeaveStatusEmail;