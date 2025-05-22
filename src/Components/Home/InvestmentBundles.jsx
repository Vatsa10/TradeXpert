import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '../../Pages/Home';

const InvestmentBundles = ({ bundles }) => {
  return (
    <section className="bundles-section">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaInfoCircle />
            <span>Investment Bundles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bundles-intro">
            <h3>Some Strategies to Help you Get Started!</h3>
            <p>These are baskets of stocks shortlisted using proven investment strategies.</p>
          </div>
          <div className="bundles-grid">
            {bundles.map((bundle, index) => (
              <div key={index} className="bundle-card">
                <div className="bundle-info">
                  <h4>{bundle.name}</h4>
                  <p className="sector">{bundle.sector}</p>
                </div>
                <div className="bundle-metrics">
                  <p className="value">₹{bundle.value}</p>
                  <p className="performance">+{bundle.performance}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default InvestmentBundles;
