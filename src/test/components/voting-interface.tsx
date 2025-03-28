'use client';
import Header from './headerVoting';
import VotingSessionInfo from './voting-session-info';
import CandidatesGallery from './candidates-gallery';
import VotingAction from './voting-action-voting';
import VotingProgress from './voting-progress';
import Footer from './footerVoting';
import { Web3Provider } from './web3-context';
import { VotingProvider } from './voting-context';

export default function VotingInterface() {
  return (
    <Web3Provider>
      <VotingProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-6 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <VotingSessionInfo />
                <CandidatesGallery />
                <VotingAction />
              </div>
              <div>
                <VotingProgress />
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </VotingProvider>
    </Web3Provider>
  );
}
