# LEGO Builder

This application facilitates LEGO set building from a collection of loose pieces.

If you have a bin of thousands or possibly tens of thousands of pieces that you want to build into lego sets, then this app can help you efficiently organize the pieces into sets. After the pieces are organized into individual sets, you're ready to build.

## Features

- Accounts
  - Login managed via Firebase, allowing you to login with your Google credentials
- Add your sets to the app
- Track pieces required per set and pieces you've found
- Piece search allows you to identify a LEGO piece and what sets it belongs in
  - Filter by color
  - Search by part name
- Integrates with rebrickable.com API for set images, piece images, and metadata
- Wishlist
  - Coming soon: will allow you to view a list of parts you need and their quantities

## Use Case

- Gather your loose LEGOs into a bin
- Identify all the sets you intend to build. Add them to the app in the My Sets tab.
- Have a physical container available for each LEGO set. Label it with the LEGO set number/name. Brown paper bags and a sharpie work well.
- Start organizing
  - Pull a LEGO piece from the bin
  - Search for the piece in the Piece Search tab
  - When found, increment the "Owned" quantity for the desired set and drop the piece in the corresponding physical container
  - Repeat

## Tips

### Search Tips

- Be sure to use the color filter
- Enter the dimensions, e.g., "2 x 4"
- Get to know the piece types; for example "Brick" vs "Plate" vs "Tile". You can enter the type and dimension like "Brick 2 x 4".
- The piece search is simple and just checks if your text is a substring of any existing piece name.

## Application Setup

This application will run on Windows, Linux or MacOS. On Windows, I use git-bash to run bash scripts.

- Install PostgreSQL
- Run `scripts/create_tables.sh`
- Create `backend/.env` and set the following:
   ```
   DATABASE_URL=postgres://username:password@localhost:5432/legodb
   REBRICKABLE_API_KEY=your_rebrickable_api_key_here
   ```
- [Optional] Create `frontend/.env.local` and set the following to allow access from web browsers on other computers on your LAN:
   ```
   REACT_APP_API_URL=http://<your-ip>:5000/api
   ```
   If you skip this, the app will only work on the machine hosting the app.
- Install backend dependencies:
   ```
   cd backend
   npm install
   ```
- Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

## Application Running

- Run the backend
   ```
   cd backend
   npm start
   ```
- Run the frontend
   ```
   cd frontend
   npm start
   ```

The backend and frontend are now running. The frontend should have opened in your default browser.
