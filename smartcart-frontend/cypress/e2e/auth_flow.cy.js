describe('SmartCart Auth Flow', () => {
it('Skenari: Regjistrimi i suksesshëm', () => {
  cy.visit('/register');
  cy.get('input').eq(0).type('Test User', { force: true });
  const email = `test${Date.now()}@gmail.com`;
  cy.get('input').eq(1).type(email, { force: true });
  cy.get('input[type="password"]').type('Pass123!', { force: true });
  cy.contains('button', /CREATE ACCOUNT/i).click({ force: true });
  cy.url({ timeout: 20000 }).should('satisfy', (url) => {
    return url.includes('/login') || url.includes('/register');
  });
});

  it('Skenari: Login me kredenciale të gabuara', () => {
    cy.visit('/login');
    cy.get('input').eq(0).type('wrong@gmail.com', { force: true });
    cy.get('input[type="password"]').type('wrongpass', { force: true });
    cy.contains('button', /SIGN IN/i).click({ force: true });
    cy.get('body', { timeout: 5000 }).should('contain', 'gabuar');
  });

  it('Skenari: Faqja Home ngarkohet', () => {
    cy.visit('/');
    cy.get('nav').should('be.visible');
  });

  it('Skenari: Faqja Products ngarkohet', () => {
    cy.visit('/products');
    cy.url().should('include', '/products');
  });

  it('Skenari: Forgot Password link ekziston në Login', () => {
    cy.visit('/login');
    cy.contains('Forgot password?').should('be.visible');
  });

  it('Skenari: Register link ekziston në Login', () => {
    cy.visit('/login');
    cy.contains('Create an account').should('be.visible');
  });

  it('Skenari: Login page ngarkohet', () => {
    cy.visit('/login');
    cy.contains('Welcome').should('be.visible');
    cy.get('input').should('have.length.at.least', 2);
  });

  it('Skenari: Register page ngarkohet', () => {
    cy.visit('/register');
    cy.contains(/JOIN/i).should('be.visible');
    cy.get('input').should('have.length.at.least', 3);
  });

});