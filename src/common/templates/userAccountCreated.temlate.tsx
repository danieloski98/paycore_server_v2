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

interface WelcomeEmailProps {
    username?: string;
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

export const WelcomeUserEmail = ({
    username = 'there',
    loginUrl = 'https://paycore.com/login',
    supportEmail = 'support@paycore.com',
    baseUrl = 'http://localhost:8080/public/',
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Paycore - Your Payroll Management Solution</Preview>
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
                            Welcome to Paycore, {username}!
                        </Heading>
                        <Text style={paragraph}>
                            We're thrilled to have you on board! Paycore is your all-in-one solution for
                            managing payroll, employee benefits, and HR processes efficiently.
                        </Text>
                        <Text style={paragraph}>
                            With Paycore, you can:
                        </Text>
                        <ul style={{ ...paragraph, listStyle: 'disc', paddingLeft: '20px' }}>
                            <li>Streamline your payroll processing</li>
                            <li>Manage employee benefits effortlessly</li>
                            <li>Track time and attendance</li>
                            <li>Generate comprehensive reports</li>
                        </ul>
                        <Text style={paragraph}>
                            To get started, click the button below to access your account:
                        </Text>
                        <Button style={button} href={loginUrl}>
                            Access Your Account
                        </Button>
                        <Text style={paragraph}>
                            If you have any questions or need assistance, our support team is here to help.
                            You can reach us at{' '}
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
                            This email was sent to you because you created an account with Paycore.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default WelcomeUserEmail;
