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

interface CompanyCreatedEmailProps {
    companyName?: string;
    adminName?: string;
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

export const CompanyCreatedEmail = ({
    companyName = 'Your Company',
    adminName = 'there',
    loginUrl = 'https://paycore.com/login',
    supportEmail = 'support@paycore.com',
    baseUrl = 'http://localhost:8080/public/',
}: CompanyCreatedEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Paycore - Your Company Has Been Successfully Created</Preview>
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
                            Welcome to Paycore, {adminName}!
                        </Heading>
                        <Text style={paragraph}>
                            Congratulations! Your company "{companyName}" has been successfully created on Paycore.
                            You're now ready to streamline your payroll and HR processes.
                        </Text>
                        <Text style={paragraph}>
                            Here's what you can do next:
                        </Text>
                        <ul style={{ ...paragraph, listStyle: 'disc', paddingLeft: '20px' }}>
                            <li>Set up your company profile and preferences</li>
                            <li>Add your employees to the system</li>
                            <li>Configure payroll settings and schedules</li>
                            <li>Set up employee benefits and deductions</li>
                            <li>Invite team members to join your organization</li>
                        </ul>
                        <Text style={paragraph}>
                            To access your company dashboard and start managing your payroll, click the button below:
                        </Text>
                        <Button style={button} href={loginUrl}>
                            Access Company Dashboard
                        </Button>
                        <Text style={paragraph}>
                            Need help getting started? Our dedicated support team is here to assist you.
                            Contact us at{' '}
                            <Link href={`mailto:${supportEmail}`} style={{ color: '#2563eb' }}>
                                {supportEmail}
                            </Link>
                        </Text>
                        <Text style={paragraph}>
                            Best regards,<br />
                            The Paycore Team
                        </Text>
                        <hr style={hr} />
                        <Text style={footer}>
                            © {new Date().getFullYear()} Paycore. All rights reserved.
                            <br />
                            This email was sent to you because you created a company account with Paycore.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default CompanyCreatedEmail; 