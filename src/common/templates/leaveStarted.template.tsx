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

export interface LeaveStartedEmailProps {
  employeeName?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  description?: string;
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

export const LeaveStartedEmail = ({
  employeeName = 'there',
  companyName = 'your company',
  startDate,
  endDate,
  totalDays,
  description,
  type,
  supportEmail = 'support@paycore.com',
  baseUrl = 'http://localhost:8080/public/',
}: LeaveStartedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your leave starts today!</Preview>
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
                color: '#10b981',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '30px 0',
              }}
            >
              Your Leave Starts Today!
            </Heading>
            <Text style={paragraph}>
              Hello {employeeName},
            </Text>
            <Text style={paragraph}>
              This is to notify you that your approved leave with {companyName} starts today. We hope you have a restful and wonderful time off.
            </Text>
            <Text style={paragraph}>
              <strong>Leave Details:</strong>
            </Text>
            <ul style={{ ...paragraph, listStyle: 'disc', paddingLeft: '20px' }}>
              {type && <li>Leave Type: {type}</li>}
              {startDate && <li>Start Date: {startDate}</li>}
              {endDate && <li>End Date: {endDate}</li>}
              {typeof totalDays === 'number' && <li>Total Days: {totalDays}</li>}
              {description && <li>Description: {description}</li>}
            </ul>
            <Text style={paragraph}>
              If you have any questions or need to make adjustments, please reach out to support at {supportEmail}.
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

export default LeaveStartedEmail;
