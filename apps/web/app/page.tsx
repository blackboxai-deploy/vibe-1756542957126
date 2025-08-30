```typescript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Bot, 
  CreditCard, 
  Globe, 
  Menu, 
  QrCode, 
  Smartphone, 
  Star, 
  TrendingUp,
  Users,
  Zap,
  ChefHat,
  Car,
  Calendar,
  BarChart3,
  Shield,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Service',
    description: 'Smart AI waiters and captains that understand customer preferences and provide personalized recommendations.',
    color: 'bg-blue-500'
  },
  {
    icon: QrCode,
    title: 'QR Menu System',
    description: 'Contactless ordering with dynamic QR menus that update in real-time with availability and pricing.',
    color: 'bg-green-500'
  },
  {
    icon: ChefHat,
    title: 'Kitchen Management',
    description: 'Streamlined kitchen operations with real-time order tracking and preparation workflows.',
    color: 'bg-orange-500'
  },
  {
    icon: Car,
    title: 'Delivery Tracking',
    description: 'Complete driver management with real-time GPS tracking and route optimization.',
    color: 'bg-purple-500'
  },
  {
    icon: Calendar,
    title: 'Room Booking',
    description: 'Integrated reservation system for hotels and restaurants with availability management.',
    color: 'bg-pink-500'
  },
  {
    icon: CreditCard,
    title: 'Smart Payments',
    description: 'Multi-currency payment processing with AI tip routing and automated billing.',
    color: 'bg-indigo-500'
  }
];

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    description: 'Perfect for small cafes and bars',
    maxDevices: 3,
    features: [
      'Up to 3 devices',
      'Basic AI assistant',
      'QR menu system',
      'Payment processing',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    description: 'Ideal for restaurants and small hotels',
    maxDevices: 10,
    features: [
      'Up to 10 devices',
      'Advanced AI agents',
      'Kitchen management',
      'Driver tracking',
      'Room booking',
      'Analytics dashboard',
      'Priority support'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: '$299',
    period: '/month',
    description: 'For large hotels and restaurant chains',
    maxDevices: 50,
    features: [
      'Up to 50 devices',
      'Custom AI training',
      'Multi-location support',
      'Advanced analytics',
      'API access',
      'White-label options',
      '24/7 phone support'
    ],
    popular: false
  }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Restaurant Owner',
    company: 'Golden Dragon',
    content: 'Hospity.AI transformed our operations. The AI waiter handles 70% of customer queries, and our order accuracy improved by 95%.',
    rating: 5,
    avatar: '/avatars/sarah.jpg'
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Hotel Manager',
    company: 'Sunset Resort',
    content: 'The integrated booking system and AI concierge have increased our guest satisfaction scores significantly. Highly recommended!',
    rating: 5,
    avatar: '/avatars/marcus.jpg'
  },
  {
    name: 'Emily Watson',
    role: 'Bar Owner',
    company: 'The Craft House',
    content: 'Setup was incredibly easy, and the QR menu system reduced our ordering time by 60%. The analytics help us optimize our menu daily.',
    rating: 5,
    avatar: '/avatars/emily.jpg'
  }
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEarlyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call your API
    console.log('Early access signup:', email);
    setEmail('');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Hospity.AI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors">
                Testimonials
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-3 h-3 mr-1" />
                AI-Powered Hospitality Platform
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-slate-900 mb-6"
              variants={fadeInUp}
            >
              Transform Your
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Restaurant
              </span>
              <br />
              with AI Intelligence
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Complete multi-tenant SaaS platform for restaurants, hotels, and bars. 
              AI waiters, QR ordering, kitchen management, driver tracking, and room booking - all in one.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeInUp}
            >
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.div 
              className="mt-12 flex items-center justify-center space-x-8 text-sm text-slate-500"
              variants={fadeInUp}
            >
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                PCI Compliant
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Multi-Currency
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                24/7 Support
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
              variants={fadeInUp}
            >
              Everything You Need to Scale
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-600 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              From AI-powered customer service to complete operational management, 
              we've got every aspect of your hospitality business covered.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
              variants={fadeInUp}
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-600 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Choose the perfect plan for your business. All plans include core features 
              with device limits based on your subscription tier.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {plans.map((plan, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={`h-full relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600 ml-1">{plan.period}</span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="flex items-center justify-center mt-2">
                      <Smartphone className="w-4 h-4 mr-2 text-slate-500" />
                      <span className="text-sm text-slate-600">Up to {plan.maxDevices} devices</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          <span className="text-slate-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
              variants={fadeInUp}
            >
              Trusted by Industry Leaders
            </motion.h2>
            <motion.p 
              className="text-xl text-slate-600 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              See how restaurants, hotels, and bars are transforming their operations with Hospity.AI
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardDescription className="text-base italic">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                        <div className="text-sm text-slate-600">
                          {testimonial.role} at {testimonial.company}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              variants={fadeInUp}
            >
              Ready to Transform Your Business?
            </motion.h2>
            <motion.p 
              className="text-xl text-blue-100 mb-8"
              variants={fadeInUp}
            >
              Join thousands of restaurants, hotels, and bars already using Hospity.AI 
              to deliver exceptional customer experiences.
            </motion.p>
            
            <motion.form 
              onSubmit={handleEarlyAccess}
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6"
              variants={fadeInUp}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button 
                type="submit" 
                variant="secondary" 
                disabled={isLoading}
                className="whitespace-nowrap"
              >
                {isLoading ? 'Signing up...' : 'Start Free Trial'}
              </Button>
            </motion.form>
            
            <motion.p 
              className="text-sm text-blue-100"
              variants={fadeInUp}
            >
              No credit card required • 14-day free trial • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Hospity.AI</span>
              </div>
              <p className="text-slate-400 mb-4">
                AI-powered hospitality platform for the modern restaurant, hotel, and bar industry.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/api-docs" className="hover:text-white transition-colors">API Docs</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Hospity.AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```