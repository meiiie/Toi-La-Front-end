// src/pages/WelcomePage.tsx

import React, { useEffect, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'tailwindcss/tailwind.css';
import Card from '../components/Card';
import Section from '../components/Section';
import ScrollButton from '../components/ScrollButton';
import {
  blockchainBenefits,
  userBenefits,
  introductionCards,
  electionSteps,
  partners,
} from '../data/constants';

const WelcomePage: React.FC = () => {
  const partnersSectionRef = useRef<HTMLElement>(null);
  const introductionSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-900 via-purple-900 to-black">
      <main className="flex-grow bg-gray-100">
        <section
          className="hero-section bg-fixed bg-center relative h-screen flex items-center justify-center"
          style={{ backgroundImage: 'url(./your-geometric-pattern1.png)' }}
        >
          <div className="overlay absolute inset-0 bg-black opacity-40"></div>
          <div className="container mx-auto text-center text-white relative z-10 p-8">
            <h1
              className="text-6xl font-bold mb-20 drop-shadow-lg tracking-widest font-sans bg-gradient-to-r from-sky-100 to-emerald-300 text-transparent bg-clip-text -mt-16"
              data-aos="fade-in"
            >
              Chào mừng bạn đến với nền tảng bầu cử trực tuyến!
            </h1>
            <button
              onClick={() => {
                const introductionSection = document.querySelector('.introduction');
                if (introductionSection) {
                  const offsetTop =
                    introductionSection.getBoundingClientRect().top + window.scrollY - 100;
                  window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
              }}
              className="mt-0 bg-gradient-to-r from-rose-700 to-blue-500 text-white px-8 py-4 rounded-full text-lg hover:from-sky-500 hover:to-green-300 transition mt-2 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transform -translate-y-4"
              data-aos="zoom-in"
            >
              Tìm hiểu thêm
            </button>
          </div>
        </section>

        <Section
          title="Giới thiệu về hệ thống bầu cử"
          className="bg-gray-800 introduction"
          ref={introductionSectionRef}
        >
          {introductionCards.map(
            (
              card: {
                title: string;
                imgSrc: string;
                description: string;
              },
              index: number,
            ) => (
              <Card
                key={index}
                title={card.title}
                icon={<img src={card.imgSrc} alt={card.title} className="mx-auto mb-4 w-24 h-24" />}
                description={card.description}
                delay={index * 100}
              />
            ),
          )}
        </Section>

        <section className="election-process py-24 bg-gray-900 text-white" data-aos="fade-up">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12 font-sans">Quy trình bầu cử</h2>
            <div className="timeline flex items-center justify-center relative">
              <div className="absolute w-full h-1 bg-gray-300 top-1/2 transform -translate-y-1/2"></div>
              {electionSteps.map((step: string, index: number) => (
                <div
                  key={index}
                  className="step p-8 bg-gray-700 rounded-full shadow-lg mx-4 relative z-10 hover:bg-gradient-to-r from-gray-800 to-sky-700"
                  data-aos="slide-right"
                  data-aos-delay={index * 100}
                >
                  <img
                    src="./baka.jpg"
                    alt={`Step ${index + 1}`}
                    className="mx-auto mb-4 w-24 h-24"
                  />
                  <h3 className="text-xl font-semibold mb-4 font-sans">{`Bước ${index + 1}`}</h3>
                  <p className="text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Section title="Tại sao chọn blockchain?" className="bg-gray-800">
          {blockchainBenefits.map(
            (
              benefit: {
                title: string;
                icon: JSX.Element;
                description: string;
              },
              index: number,
            ) => (
              <Card
                key={index}
                title={benefit.title}
                icon={benefit.icon}
                description={benefit.description}
                delay={index * 100}
              />
            ),
          )}
        </Section>

        <Section title="Lợi ích cho người dùng" className="bg-gray-900">
          {userBenefits.map(
            (benefit: { title: string; icon: JSX.Element; description: string }, index: number) => (
              <Card
                key={index}
                title={benefit.title}
                icon={benefit.icon}
                description={benefit.description}
                delay={index * 100}
              />
            ),
          )}
        </Section>

        <Section
          title="Đối tác và thông tin liên hệ"
          className="bg-gray-800"
          ref={partnersSectionRef}
        >
          {partners.map((partner: { imgSrc: string; name: string }, index: number) => (
            <div
              key={index}
              className="p-8 bg-gray-700 rounded shadow-lg transform transition duration-300 hover:scale-105"
            >
              <img src={partner.imgSrc} alt={partner.name} className="mx-auto w-32 h-32" />
              <p className="mt-4">{partner.name}</p>
            </div>
          ))}
        </Section>
      </main>

      <ScrollButton partnersSectionRef={partnersSectionRef} />
    </div>
  );
};

export default WelcomePage;
