from typing import List
from models.product import NormalizedProductGroup, IntentResult

class RankingService:
    @staticmethod
    def rank_products(groups: List[NormalizedProductGroup], intent: IntentResult) -> List[NormalizedProductGroup]:
        if not groups:
            return []
            
        # Determine weight multipliers based on intent
        price_weight = 25
        trust_weight = 15
        
        pref_price = intent.preferences.get("price_priority", "medium").lower()
        if pref_price == "high": price_weight = 40
        elif pref_price == "very_high": price_weight = 50
            
        pref_trust = intent.preferences.get("trust_priority", "medium").lower()
        if pref_trust == "high": trust_weight = 30
        elif pref_trust == "very_high": trust_weight = 40
            
        match_weight = 35
        reviews_weight = 20
        availability_weight = 5
        
        # Normalize maximums for relative scoring
        prices = [g.best_price for g in groups if g.best_price is not None]
        max_price = max(prices) if prices else 1.0
        min_price = min(prices) if prices else 1.0
        
        reviews_counts = [g.total_reviews for g in groups]
        max_reviews = max(reviews_counts) if reviews_counts else 1.0
        
        for g in groups:
            score = 0.0
            
            # 1. Price Score (lower is better)
            if g.best_price:
                price_ratio = min_price / g.best_price  # 1.0 if cheapest, approaches 0 as price goes up
                score += price_ratio * price_weight
                
            # 2. Reviews & Rating Score
            if g.aggregate_rating:
                rating_score = (g.aggregate_rating / 5.0) * (reviews_weight * 0.7)
                review_vol_score = min(1.0, g.total_reviews / (max_reviews + 1)) * (reviews_weight * 0.3)
                score += rating_score + review_vol_score
                
            # 3. Match Score (heuristic: does title contain query keywords)
            query_terms = intent.search_query.lower().split()
            match_hits = sum(1 for term in query_terms if term in g.title.lower())
            match_ratio = match_hits / len(query_terms) if query_terms else 1.0
            score += match_ratio * match_weight
            
            # 4. Trust Score (heuristic: number of marketplaces present + rating volume)
            marketplaces = len(set(p.store for p in g.products))
            trust_ratio = (marketplaces / 2.0) * 0.5 + min(1.0, g.total_reviews / 5000.0) * 0.5
            score += trust_ratio * trust_weight
            
            # 5. Availability (assuming all are available if scraped, unless stated otherwise)
            score += availability_weight
            
            g.rank_score = round(score, 1)
            
        # Sort by score descending
        groups.sort(key=lambda x: x.rank_score, reverse=True)
        
        # Assign Categories (Badges)
        if len(groups) > 0:
            groups[0].badges.append("Best Overall")
            groups[0].rank_reason = "Ranked #1 because it has the strongest combination of specs match, review volume, and competitive pricing."
            
        # Cheapest
        valid_prices = [g for g in groups if g.best_price is not None]
        if valid_prices:
            cheapest = min(valid_prices, key=lambda x: x.best_price)
            if "Best Overall" not in cheapest.badges: # Avoid overlapping
                cheapest.badges.append("Cheapest")
                cheapest.rank_reason = f"This is the most affordable valid option we found at ₹{cheapest.best_price}."
                
        # Most Trusted
        trusted = sorted(groups, key=lambda x: (x.total_reviews, x.aggregate_rating or 0), reverse=True)
        if trusted:
            most_trusted = trusted[0]
            if "Most Trusted" not in most_trusted.badges and "Best Overall" not in most_trusted.badges:
                most_trusted.badges.append("Most Trusted")
                most_trusted.rank_reason = f"Backed by {most_trusted.total_reviews}+ reviews, indicating a highly reliable purchase."
                
        # Best Value (Highest score / price ratio)
        value_groups = [g for g in groups if g.best_price and g.best_price > 0]
        if value_groups:
            best_value = max(value_groups, key=lambda x: x.rank_score / x.best_price)
            if not best_value.badges: # Only assign if it doesn't already have a badge
                best_value.badges.append("Best Value")
                best_value.rank_reason = "Offers the best balance of features, positive reviews, and lower cost."
                
        return groups
